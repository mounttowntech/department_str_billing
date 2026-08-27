const router = require("express").Router();

const {
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require("../controllers/profileController");

const { verifyToken } = require("../middleware/authMiddleware");

// ============================================================
// GET CURRENT PROFILE
// GET /api/profile/
// ============================================================

router.get(
  "/",
  verifyToken,
  getMyProfile
);

// ============================================================
// UPDATE PROFILE
// PUT /api/profile/update
// ============================================================

router.put(
  "/update",
  verifyToken,
  updateMyProfile
);

// ============================================================
// CHANGE PASSWORD
// PUT /api/profile/change-password
// ============================================================

router.put(
  "/change-password",
  verifyToken,
  changePassword
);

module.exports = router;