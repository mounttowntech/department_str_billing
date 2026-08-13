const router = require("express").Router();

const {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  toggleBrandStatus,
  deleteBrand,
} = require("../controllers/BrandController");

const { verifyToken } = require("../middleware/authMiddleware");
const { uploadBrandLogo } = require("../middleware/uploadBrandLogo");

router.post("/create", verifyToken, uploadBrandLogo.single("logo"), createBrand);
router.get("/all", verifyToken, getAllBrands);
router.get("/:id", verifyToken, getBrandById);
router.put("/update/:id", verifyToken, uploadBrandLogo.single("logo"), updateBrand);

// Same naming quirk as your Category routes: mounted at /activate/:id
// even though the handler flips active <-> inactive either way.
router.patch("/activate/:id", verifyToken, toggleBrandStatus);

router.delete("/delete/:id", verifyToken, deleteBrand);

module.exports = router;