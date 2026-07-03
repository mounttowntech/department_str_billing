const router = require("express").Router();
const c = require("../controllers/ReportController");

router.get("/sales", c.salesReport);
router.get(
  "/purchases",
  
  c.purchaseReport,
);
router.get("/stock", c.stockReport);
router.get("/expenses",  c.expenseReport);
router.get("/profit-loss", c.profitLoss);
module.exports = router;
