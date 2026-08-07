const router = require("express").Router();
const upload = require("../middleware/upload");
const {
  createDepartmentCategory,
  getAllDepartmentCategory,
  getDepartmentCategoryById,
  updateDepartmentCategory,
  toggleDepartmentCategory,
  deleteDepartmentCategory,
} = require("../controllers/DepartmentCategoryController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post(
  "/create",
  verifyToken,
  upload.single("image"),
  createDepartmentCategory
);

router.get(
  "/all",
  verifyToken,
  getAllDepartmentCategory
);

router.get(
  "/:id",
  verifyToken,
  getDepartmentCategoryById
);

router.put(
  "/update/:id",
  verifyToken,
  upload.single("image"),
  updateDepartmentCategory
);
router.patch(
  "/toggle/:id",
  verifyToken,
  toggleDepartmentCategory
);

router.delete(
  "/delete/:id",
  verifyToken,
  deleteDepartmentCategory
);

module.exports = router;