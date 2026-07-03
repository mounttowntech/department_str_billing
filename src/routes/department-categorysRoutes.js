const router = require("express").Router();
const c = require("../controllers/DepartmentCategoryController");

router.post(
  "/create",
  c.createDepartmentCategory,
);
router.get(
  "/all",
  c.getAllDepartmentCategory,
);
router.get(
  "/:id",
  c.getDepartmentCategoryById,
);
router.put(
  "/:id",
  c.updateDepartmentCategory,
);
router.delete(
  "/:id",
  
  c.deleteDepartmentCategory,
);
module.exports = router;
