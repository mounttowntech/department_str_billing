const router = require("express").Router();

const {
  createRolePermission,
  getAllRolePermission,
  getRolePermissionById,
  updateRolePermission,
  deleteRolePermission,
  activateRolePermission,
  toggleRolePermissionStatus,
} = require("../controllers/RolePermissionController");

const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================================
// PUBLIC - REQUIRED FOR REGISTRATION
// ==========================================================

router.get("/all", getAllRolePermission);

// ==========================================================
// PROTECTED - ROLE MANAGEMENT
// ==========================================================

router.post("/create", verifyToken, createRolePermission);

router.get("/:id", verifyToken, getRolePermissionById);

router.put("/update/:id", verifyToken, updateRolePermission);

router.patch(
  "/toggle/:id",
  verifyToken,
  toggleRolePermissionStatus
);

router.delete(
  "/delete/:id",
  verifyToken,
  deleteRolePermission
);

module.exports = router;