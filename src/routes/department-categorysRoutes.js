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


const uploadCategoryFiles = uploadCategoryImage.fields([
  { name: "image", maxCount: 1 },
  { name: "icon", maxCount: 1 },
]);

router.post(
  "/create",
  verifyToken,
  uploadCategoryFiles,
  createDepartmentCategory
);

router.get("/all", verifyToken, getAllDepartmentCategory);
router.get("/:id", verifyToken, getDepartmentCategoryById);

router.put(
  "/update/:id",
  verifyToken,
  uploadCategoryFiles,
  updateDepartmentCategory
);

router.patch("/activate/:id", verifyToken, toggleDepartmentCategory);
router.delete("/delete/:id", verifyToken, deleteDepartmentCategory);

module.exports = router;