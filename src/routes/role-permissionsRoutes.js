const router = require("express").Router();
const c = require("../controllers/RolePermissionController");

router.post(
  "/create",
  
  c.createRolePermission,
);
router.get(
  "/all",
  
  c.getAllRolePermission,
);
router.get(
  "/:id",
  
  c.getRolePermissionById,
);
router.put(
  "/:id",
 
  c.updateRolePermission,
);
router.delete(
  "/:id",
  
  c.deleteRolePermission,
);
module.exports = router;
