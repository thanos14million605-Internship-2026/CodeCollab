const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
} = require("../controllers/authController");

const { authenticate } = require("../middleware/authMiddleware");

const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .isIn(["teacher", "student"])
    .withMessage("Role must be either teacher or student"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateForgotPassword = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
];

const validateResetPassword = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("avatar_url")
    .optional()
    .isURL()
    .withMessage("Avatar URL must be a valid URL"),
];

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.get("/me", authenticate, getCurrentUser);
router.put("/profile", authenticate, validateUpdateProfile, updateProfile);

module.exports = router;
