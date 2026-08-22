const express = require("express");

const router = express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const stockAdjustmentController = require("../controllers/StockAdjustmentController");

// GET ALL
router.get(
  "/all",
  verifyToken,
  stockAdjustmentController.getAllStockAdjustment
);

// GET BY ID
router.get(
  "/:id",
  verifyToken,
  stockAdjustmentController.getStockAdjustmentById
);

// CREATE
router.post(
  "/create",
  verifyToken,
  stockAdjustmentController.createStockAdjustment
);

// UPDATE
router.put(
  "/update/:id",
  verifyToken,
  stockAdjustmentController.updateStockAdjustment
);

// PERMANENT DELETE
router.delete(
  "/delete/:id",
  verifyToken,
  stockAdjustmentController.deleteStockAdjustment
);

module.exports = router;