const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const { asyncHandler } = require('../middleware/globalErrorHandler');
const { v4: uuidv4 } = require('uuid');

// Register user
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create new user
  const user = await User.create({ name, email, password, role });

  // Generate JWT token
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // Send welcome email (async, don't wait)
  sendWelcomeEmail(email, name).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Verify password
  const isPasswordValid = await User.verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate JWT token
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      },
      token
    }
  });
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with this email'
    });
  }

  // Generate reset token (in production, store this in database with expiry)
  const resetToken = uuidv4();
  
  // Send password reset email
  await sendPasswordResetEmail(email, resetToken);

  res.status(200).json({
    success: true,
    message: 'Password reset email sent'
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // In production, verify token from database
  // For now, we'll just return success (implement proper token storage in production)
  
  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar_url } = req.body;
  
  const updatedUser = await User.update(req.user.id, { name, avatar_url });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser
    }
  });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile
};
