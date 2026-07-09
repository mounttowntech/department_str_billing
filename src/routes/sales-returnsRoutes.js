const express = require("express");
const router = express.Router();

const {
  createSalesReturn,
  getSalesReturns,
  getSalesReturnById,
  updateSalesReturn,
  deleteSalesReturn,
} = require("../controllers/salesReturnController");

const { verifyToken } = require("../middleware/authMiddleware");

// Create
router.post("/create", verifyToken, createSalesReturn);

// List
router.get("/all", verifyToken, getSalesReturns);

// Get By ID
router.get("/:id", verifyToken, getSalesReturnById);

// Update
router.put("/update/:id", verifyToken, updateSalesReturn);

// Soft Delete
router.delete("/delete/:id", verifyToken, deleteSalesReturn);

module.exports = router;