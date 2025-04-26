const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://viswa:datta12345@cluster0.xrgo6.mongodb.net/kinde?retryWrites=true&w=majority&appName=Cluster0");

// User Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  organizationName: String,
  roleName: String,
  orgId: String,
  roleId: String
});

const User = mongoose.model('User', userSchema);

// Middleware to verify JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, organizationName, roleName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Get Kinde access token
    const tokenResponse = await fetch(`https://shopifynew.kinde.com/oauth2/token`, {
      method: "POST",
      headers: { 
        "content-type": "application/x-www-form-urlencoded" 
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: "b81a4b7be0664577a4cfc9229ba77606",
        client_secret: "vi3smAL0rFFrHQfrR5kzqu90Psz2A9Uxclb6TZOOyLCrnxEV4v26",

        audience: "https://shopifynew.kinde.com/api"
      })
    });
    
    const { access_token } = await tokenResponse.json();

    // Check if organization exists
    const getOrgsResponse = await fetch(`https://shopifynew.kinde.com/api/v1/organizations?name=${encodeURIComponent(organizationName)}`, {
      headers: {
        "Authorization": `Bearer ${access_token}`
      }
    });

    let org = await getOrgsResponse.json();
    let orgCode;

    if (!org.organizations || org.organizations.length === 0) {
      const createOrgResponse = await fetch(`https://shopifynew.kinde.com/api/v1/organization`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: organizationName,
          features: {},
          is_sandbox: false
        })
      });

      org = await createOrgResponse.json();
      orgCode = org.organization.code;
    } else {
      orgCode = org.organizations[0].code;
    }

    // Check if role exists
    const getRolesResponse = await fetch(`https://shopifynew.kinde.com/api/v1/roles?name=${encodeURIComponent(roleName)}`, {
      headers: {
        "Authorization": `Bearer ${access_token}`
      }
    });

    let role = await getRolesResponse.json();
    let roleId;

    if (!role.roles || role.roles.length === 0) {
      const roleKey = `${roleName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const createRoleResponse = await fetch(`https://shopifynew.kinde.com/api/v1/roles`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: roleName,
          description: `Custom role for ${roleName}`,
          key: roleKey,
          is_default_role: false
        })
      });

      role = await createRoleResponse.json();
      roleId = role.role.id;
    } else {
      roleId = role.roles[0].id;
    }

    // Create user in Kinde
    const createUserResponse = await fetch(`https://shopifynew.kinde.com/api/v1/user`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identities: [{
          type: "email",
          details: {
            email: email
          }
        }],
        given_name: firstName,
        family_name: lastName,
        organization_code: orgCode
      })
    });

    const kindeUser = await createUserResponse.json();

    // Add role to user in Kinde
    await fetch(`https://shopifynew.kinde.com/api/v1/organizations/${orgCode}/users/${kindeUser.id}/roles`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role_id: roleId
      })
    });

    // Create user in MongoDB
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      organizationName,
      roleName,
      orgId: orgCode,
      roleId
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        firstName,
        lastName,
        email,
        organizationName,
        roleName,
        rid: user.roleId,
        oid: user.orgId
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organizationName: user.organizationName,
        roleName: user.roleName,
        rid: user.roleId,
        oid: user.orgId
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected Route - Get User Profile
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      organizationName: req.user.organizationName,
      roleName: req.user.roleName,
      orgId: req.user.orgId,
      roleId: req.user.roleId
    }
  });
});

const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
