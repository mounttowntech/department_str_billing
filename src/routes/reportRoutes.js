const router = require("express").Router();
const c = require("../controllers/ReportController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.get("/sales", checkPermission("Reports", "canView"), c.salesReport);
router.get(
  "/purchases",
  checkPermission("Reports", "canView"),
  c.purchaseReport,
);
router.get("/stock", checkPermission("Reports", "canView"), c.stockReport);
router.get("/expenses", checkPermission("Reports", "canView"), c.expenseReport);
router.get("/profit-loss", checkPermission("Reports", "canView"), c.profitLoss);
module.exports = router;
