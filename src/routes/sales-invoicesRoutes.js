const express = require("express");

const router = express.Router();

const {
  createSalesInvoice,
  getSalesInvoices,
  getSalesInvoiceById,
  updateSalesInvoice,
  deleteSalesInvoice,
} = require("../controllers/salesInvoiceController");

const { verifyToken } = require("../middleware/authMiddleware");

// Create Sales Invoice
router.post("/create", verifyToken, createSalesInvoice);

// Get All Sales Invoices
router.get("/all", verifyToken, getSalesInvoices);

// Get Sales Invoice By ID
router.get("/:id", verifyToken, getSalesInvoiceById);

// Update Sales Invoice
router.put("/update/:id", verifyToken, updateSalesInvoice);

// Soft Delete Sales Invoice
router.delete("/delete/:id", verifyToken, deleteSalesInvoice);

module.exports = router;