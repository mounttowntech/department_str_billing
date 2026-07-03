const router = require("express").Router();
const c = require("../controllers/DepartmentSubCategoryController");

router.post(
  "/create",
  c.createDepartmentSubCategory,
);
router.get(
  "/all",
  c.getAllDepartmentSubCategory,
);
router.get(
  "/:id",
  c.getDepartmentSubCategoryById,
);
router.put(
  "/:id",
  c.updateDepartmentSubCategory,
);
router.delete(
  "/:id",
  c.deleteDepartmentSubCategory,
);
module.exports = router;
