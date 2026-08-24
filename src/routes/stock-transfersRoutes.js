const router = require("express").Router();
const controller = require("../controllers/StockTransferController");
const { verifyToken } = require("../middleware/authMiddleware");

// Create Stock Transfer
router.post(
  "/create",
  verifyToken,
  controller.createStockTransfer
);

// Get All Stock Transfers
router.get(
  "/all",
  verifyToken,
  controller.getStockTransfer
);

// Get Stock Transfer By ID
router.get(
  "/:id",
  verifyToken,
  controller.getStockTransferById
);

// Update Stock Transfer
router.put(
  "/update/:id",
  verifyToken,
  controller.updateStockTransferById
);

// Cancel Stock Transfer
router.patch(
  "/cancel/:id",
  verifyToken,
  controller.cancelStockTransfer
);

// Delete Stock Transfer
router.delete(
  "/delete/:id",
  verifyToken,
  controller.deleteStockTransferById
);

module.exports = router;