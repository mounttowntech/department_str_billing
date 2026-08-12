const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  activateProduct,
  deactivateProduct,
  getTopSellingProducts,
  getLowStockProducts,
} = require("../controllers/ProductController");

const { verifyToken } = require("../middleware/authMiddleware");
const { uploadProductImage } = require("../middleware/uploadProductImage");

router.post(
  "/create",
  verifyToken,
  uploadProductImage.single("image"),
  createProduct
);

router.get("/all", verifyToken, getProducts);
router.get("/top-products", verifyToken, getTopSellingProducts);
router.get("/low-stock", verifyToken, getLowStockProducts);
router.get("/:id", verifyToken, getProductById);

router.put(
  "/update/:id",
  verifyToken,
  uploadProductImage.single("image"),
  updateProduct
);

router.patch("/activate/:id", verifyToken, activateProduct);
router.patch("/deactivate/:id", verifyToken, deactivateProduct);

// Permanent delete
router.delete("/delete/:id", verifyToken, deleteProduct);

module.exports = router;