const router = require("express").Router();
const c = require("../controllers/StockTransferController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("StockTransfer", "canCreate"),
  c.createStockTransfer,
);
router.get(
  "/",
  checkPermission("StockTransfer", "canView"),
  c.getAllStockTransfer,
);
router.get(
  "/:id",
  checkPermission("StockTransfer", "canView"),
  c.getStockTransferById,
);
router.put(
  "/:id",
  checkPermission("StockTransfer", "canEdit"),
  c.updateStockTransfer,
);
router.delete(
  "/:id",
  checkPermission("StockTransfer", "canDelete"),
  c.deleteStockTransfer,
);
module.exports = router;
