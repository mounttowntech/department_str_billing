const router = require("express").Router();

const {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  activateBrand,
} = require("../controllers/BrandController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createBrand);
router.get("/all", verifyToken, getAllBrands);
router.get("/:id", verifyToken, getBrandById);
router.put("/update/:id", verifyToken, updateBrand);
router.patch("/activate/:id", verifyToken, activateBrand);
router.delete("/delete/:id", verifyToken, deleteBrand);

module.exports = router;