const router = require("express").Router();
const c = require("../controllers/DepartmentCategoryController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("DepartmentCategory", "canCreate"),
  c.createDepartmentCategory,
);
router.get(
  "/",
  checkPermission("DepartmentCategory", "canView"),
  c.getAllDepartmentCategory,
);
router.get(
  "/:id",
  checkPermission("DepartmentCategory", "canView"),
  c.getDepartmentCategoryById,
);
router.put(
  "/:id",
  checkPermission("DepartmentCategory", "canEdit"),
  c.updateDepartmentCategory,
);
router.delete(
  "/:id",
  checkPermission("DepartmentCategory", "canDelete"),
  c.deleteDepartmentCategory,
);
module.exports = router;
