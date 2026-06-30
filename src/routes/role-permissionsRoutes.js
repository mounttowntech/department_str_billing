const router = require("express").Router();
const c = require("../controllers/RolePermissionController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("RolePermission", "canCreate"),
  c.createRolePermission,
);
router.get(
  "/",
  checkPermission("RolePermission", "canView"),
  c.getAllRolePermission,
);
router.get(
  "/:id",
  checkPermission("RolePermission", "canView"),
  c.getRolePermissionById,
);
router.put(
  "/:id",
  checkPermission("RolePermission", "canEdit"),
  c.updateRolePermission,
);
router.delete(
  "/:id",
  checkPermission("RolePermission", "canDelete"),
  c.deleteRolePermission,
);
module.exports = router;
