const router = require("express").Router();

const {
  createDepartmentSubCategory,
  getAllDepartmentSubCategory,
  getDepartmentSubCategoryById,
  updateDepartmentSubCategory,
  deleteDepartmentSubCategory,
  activateDepartmentSubCategory,
} = require("../controllers/DepartmentSubCategoryController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createDepartmentSubCategory);
router.get("/all", verifyToken, getAllDepartmentSubCategory);
router.get("/:id", verifyToken, getDepartmentSubCategoryById);
router.put("/update/:id", verifyToken, updateDepartmentSubCategory);
router.patch("/activate/:id", verifyToken, activateDepartmentSubCategory);
router.delete("/delete/:id", verifyToken, deleteDepartmentSubCategory);

module.exports = router;