const express = require("express");
const router = express.Router();

const {
  salesReport,
  purchaseReport,
  stockReport,
  expenseReport,
  profitLoss,
} = require("../controllers/ReportController");

const { verifyToken } = require("../middleware/authMiddleware");

// Reports
router.get("/sales", salesReport);

router.get("/purchases",  purchaseReport);

router.get("/stock",stockReport);

router.get("/expenses",  expenseReport);

router.get("/profit-loss", profitLoss);

module.exports = router;