const router = require("express").Router();

const controller = require("../controllers/StockLedgerController");
const {verifyToken} = require("../middleware/authMiddleware");
// Create
router.post(
  "/create",
  controller.createStockLedger
);

// Get All
router.get(
  "/all",
  controller.getStockLedger
);

// Get By Id
router.get(
  "/:id",
  controller.getStockLedgerById
);

// Update
router.put(
  "/update/:id",
  controller.updateStockLedgerById
);

// Delete
router.delete(
  "/delete/:id",
  verifyToken,
  controller.deleteStockLedgerById
);

module.exports = router;