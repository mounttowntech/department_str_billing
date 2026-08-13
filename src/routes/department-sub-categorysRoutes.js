const router = require("express").Router();

const {
  createDepartmentSubCategory,
  getAllDepartmentSubCategory,
  getDepartmentSubCategoryById,
  updateDepartmentSubCategory,
  activateDepartmentSubCategory,
  deactivateDepartmentSubCategory,
  deleteDepartmentSubCategory,
} = require("../controllers/DepartmentSubCategoryController");

const { verifyToken } = require("../middleware/authMiddleware");

const {
  uploadCategoryImage,
} = require("../middleware/uploadMiddleware");

router.post(
  "/create",
  verifyToken,
  uploadCategoryImage.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  createDepartmentSubCategory
);

router.get("/all", verifyToken, getAllDepartmentSubCategory);

router.get("/:id", verifyToken, getDepartmentSubCategoryById);

router.put(
  "/update/:id",
  verifyToken,
  uploadCategoryImage.fields([
    { name: "image", maxCount: 1 },
    { name: "icon", maxCount: 1 },
  ]),
  updateDepartmentSubCategory
);

router.patch(
  "/activate/:id",
  verifyToken,
  activateDepartmentSubCategory
);

router.patch(
  "/deactivate/:id",
  verifyToken,
  deactivateDepartmentSubCategory
);

router.delete(
  "/delete/:id",
  verifyToken,
  deleteDepartmentSubCategory
);

module.exports = router;