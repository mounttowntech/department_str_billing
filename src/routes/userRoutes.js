const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
} = require("../controllers/authController");

const verifyToken = require("../middleware/authMiddleware");
// const upload = require("../middleware/upload");

// Register
router.post("/register", register);

// If using profile image upload:
// router.post("/register", upload.single("profileImage"), register);

// Login
router.post("/login", login);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password", resetPassword);

// Change Password
router.put("/change-password", verifyToken, changePassword);

// Logged-in user details
router.get("/me", verifyToken, me);

module.exports = router;