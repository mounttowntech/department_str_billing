const router = require("express").Router();
const c = require("../controllers/StockLedgerController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("StockLedger", "canCreate"),
  c.createStockLedger,
);
router.get("/", checkPermission("StockLedger", "canView"), c.getAllStockLedger);
router.get(
  "/:id",
  checkPermission("StockLedger", "canView"),
  c.getStockLedgerById,
);
router.put(
  "/:id",
  checkPermission("StockLedger", "canEdit"),
  c.updateStockLedger,
);
router.delete(
  "/:id",
  checkPermission("StockLedger", "canDelete"),
  c.deleteStockLedger,
);
module.exports = router;
