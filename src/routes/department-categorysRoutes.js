const router = require("express").Router();

const {
  createDepartmentCategory,
  getAllDepartmentCategory,
  getDepartmentCategoryById,
  updateDepartmentCategory,
  deleteDepartmentCategory,
  activateDepartmentCategory,
} = require("../controllers/DepartmentCategoryController");

const { verifyToken } = require("../middleware/authMiddleware");
const {
  uploadCategoryImage,
} = require("../middleware/uploadMiddleware");

router.post("/create", verifyToken, uploadCategoryImage.single("image"),createDepartmentCategory);
router.get("/all", verifyToken, getAllDepartmentCategory);
router.get("/:id", verifyToken, getDepartmentCategoryById);
router.put("/update/:id", verifyToken, updateDepartmentCategory);
router.patch("/activate/:id", verifyToken, activateDepartmentCategory);
router.delete("/delete/:id", verifyToken, deleteDepartmentCategory);

module.exports = router;
