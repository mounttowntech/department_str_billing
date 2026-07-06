const express = require("express");
const router = express.Router();

const {
  createSalesReturn,
  getSalesReturns,
  getSalesReturnById,
  deleteSalesReturn,
} = require("../controllers/salesReturnController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createSalesReturn);
router.get("/all", verifyToken, getSalesReturns);
router.get("/:id", verifyToken, getSalesReturnById);
router.delete("/:id", verifyToken, deleteSalesReturn);

module.exports = router;