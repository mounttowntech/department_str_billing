const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  activateProduct
} = require("../controllers/ProductController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createProduct);
router.get("/all", verifyToken, getProducts);
router.get("/low-stock", verifyToken, getLowStockProducts);
router.get("/:id", verifyToken, getProductById);
router.put("/update/:id", verifyToken, updateProduct);
router.delete("/delete/:id", verifyToken, deleteProduct);
router.patch("/activate/:id", verifyToken, activateProduct);
module.exports = router;