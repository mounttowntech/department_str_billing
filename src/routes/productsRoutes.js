const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/ProductController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createProduct);
router.get("/all", verifyToken, getProducts);
router.get("/low-stock", verifyToken, getLowStockProducts);
router.get("/:id", verifyToken, getProductById);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;