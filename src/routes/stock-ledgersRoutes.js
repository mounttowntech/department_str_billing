const router = require("express").Router();
const controller = require("../controllers/StockLedgerController");
const { verifyToken } = require("../middleware/authMiddleware");

// Create
router.post("/create", verifyToken, controller.createStockLedger);

// Get All
router.get("/all", verifyToken, controller.getStockLedger);

// Get By ID
router.get("/:id", verifyToken, controller.getStockLedgerById);

// Update
router.put("/update/:id", verifyToken, controller.updateStockLedgerById);

// Delete
router.delete("/delete/:id", verifyToken, controller.deleteStockLedgerById);

module.exports = router;