const router = require("express").Router();
const c = require("../controllers/StockAdjustmentController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("StockAdjustment", "canCreate"),
  c.createStockAdjustment,
);
router.get(
  "/",
  checkPermission("StockAdjustment", "canView"),
  c.getAllStockAdjustment,
);
router.get(
  "/:id",
  checkPermission("StockAdjustment", "canView"),
  c.getStockAdjustmentById,
);
router.put(
  "/:id",
  checkPermission("StockAdjustment", "canEdit"),
  c.updateStockAdjustment,
);
router.delete(
  "/:id",
  checkPermission("StockAdjustment", "canDelete"),
  c.deleteStockAdjustment,
);
module.exports = router;
