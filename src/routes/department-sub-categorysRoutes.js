const router = require("express").Router();
const c = require("../controllers/DepartmentSubCategoryController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("DepartmentSubCategory", "canCreate"),
  c.createDepartmentSubCategory,
);
router.get(
  "/",
  checkPermission("DepartmentSubCategory", "canView"),
  c.getAllDepartmentSubCategory,
);
router.get(
  "/:id",
  checkPermission("DepartmentSubCategory", "canView"),
  c.getDepartmentSubCategoryById,
);
router.put(
  "/:id",
  checkPermission("DepartmentSubCategory", "canEdit"),
  c.updateDepartmentSubCategory,
);
router.delete(
  "/:id",
  checkPermission("DepartmentSubCategory", "canDelete"),
  c.deleteDepartmentSubCategory,
);
module.exports = router;
