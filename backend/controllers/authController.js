const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../utils/email");
const { asyncHandler } = require("../middleware/globalErrorHandler");
const { v4: uuidv4 } = require("uuid");

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email",
    });
  }

  const user = await User.create({ name, email, password, role });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  sendWelcomeEmail(email, name).catch(console.error);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await User.verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      token,
    },
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No user found with this email",
    });
  }

  const resetToken = uuidv4();

  await sendPasswordResetEmail(email, resetToken);

  res.status(200).json({
    success: true,
    message: "Password reset email sent",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar_url } = req.body;

  const updatedUser = await User.update(req.user.id, { name, avatar_url });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: updatedUser,
    },
  });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
};
