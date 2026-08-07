const router = require("express").Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { uploadCategoryImage } = require("../middleware/uploadMiddleware");

const {
  createDepartmentCategory,
  getAllDepartmentCategory,
  getDepartmentCategoryById,
  updateDepartmentCategory,
   toggleDepartmentCategory,
  deleteDepartmentCategory,
} = require("../controllers/DepartmentCategoryController");

router.post(
  "/create",
  verifyToken,
  uploadCategoryImage.single("image"),
  createDepartmentCategory
);

router.get("/all", verifyToken, getAllDepartmentCategory);
router.get("/:id", verifyToken, getDepartmentCategoryById);
router.put("/update/:id", verifyToken, updateDepartmentCategory);
router.patch("/activate/:id", verifyToken, toggleDepartmentCategory);
router.delete("/delete/:id", verifyToken, deleteDepartmentCategory);

module.exports = router;