const express = require("express");
const router = express.Router();

const {
  getDashboardOverview,
} = require("../controllers/dashboardController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/overview", verifyToken, getDashboardOverview);

module.exports = router;