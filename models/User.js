const mongoose = require('mongoose');

/**
 * User Schema for authentication and authorization
 */
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  roleName: {
    type: String,
    required: true,
    trim: true
  },
  orgId: {
    type: String,
    required: true
  },
  roleId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);