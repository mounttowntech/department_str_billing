const express = require("express");
const router = express.Router();

const {
  createBatch,
  getAllBatch,
  getBatchById,
  updateBatch,
  deleteBatch,
  getExpiredBatch,
  getLowStockBatch,
  getBatchByBarcode,
  getBatchByProduct,
} = require("../controllers/BatchController");

const { verifyToken } = require("../middleware/authMiddleware");

// Create Batch
router.post("/create", verifyToken, createBatch);

// Get All Batches
router.get("/all", verifyToken, getAllBatch);

// Expired Batches
router.get("/expired", verifyToken, getExpiredBatch);

// Low Stock Batches
router.get("/low-stock", verifyToken, getLowStockBatch);

// Get Batch by Barcode
router.get("/barcode/:barcode", verifyToken, getBatchByBarcode);

// Get Product Batches
router.get("/product/:productId", verifyToken, getBatchByProduct);

// Get Batch by ID
router.get("/:id", verifyToken, getBatchById);

// Update Batch
router.put("/update/:id", verifyToken, updateBatch);

// Soft Delete Batch
router.delete("/delete/:id", verifyToken, deleteBatch);

module.exports = router;