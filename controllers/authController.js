const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const kindeService = require('../services/kindeService');

/**
 * Controller for authentication operations
 */
const authController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  signup: async (req, res) => {
    try {
      const { firstName, lastName, email, password, organizationName, roleName } = req.body;
      
      // Validate input
      if (!firstName || !lastName || !email || !password || !organizationName || !roleName) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Get Kinde access token
      const accessToken = await kindeService.getAccessToken();

      // Get or create organization
      const orgCode = await kindeService.getOrCreateOrganization(organizationName, accessToken);

      // Get or create role
      const roleId = await kindeService.getOrCreateRole(roleName, accessToken);

      // Create user in Kinde
      const kindeUser = await kindeService.createUser(
        { firstName, lastName, email },
        orgCode,
        accessToken
      );

      // Assign role to user
      await kindeService.assignRoleToUser(
        kindeUser.id,
        orgCode,
        roleId,
        accessToken
      );

      // Create user in our database
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
      console.error('Signup error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Login an existing user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
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
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile: async (req, res) => {
    try {
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
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController;