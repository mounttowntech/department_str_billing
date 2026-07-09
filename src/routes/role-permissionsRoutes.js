const router = require("express").Router();

const {
  createRolePermission,
  getAllRolePermission,
  getRolePermissionById,
  updateRolePermission,
  deleteRolePermission,
  activateRolePermission,
} = require("../controllers/RolePermissionController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createRolePermission);
router.get("/all", verifyToken, getAllRolePermission);
router.get("/:id", verifyToken, getRolePermissionById);
router.put("/update/:id", verifyToken, updateRolePermission);
router.patch("/activate/:id", verifyToken, activateRolePermission);
router.delete("/delete/:id", verifyToken, deleteRolePermission);

module.exports = router;