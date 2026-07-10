const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/DashboardController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get(
  "/cards",
  dashboardController.cards
);

router.get(
  "/recent",

  dashboardController.recent
);

module.exports = router;