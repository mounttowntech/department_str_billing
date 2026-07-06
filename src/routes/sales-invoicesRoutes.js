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

router.post("/create", verifyToken, createSalesInvoice);
router.get("/all", verifyToken, getSalesInvoices);
router.get("/:id", verifyToken, getSalesInvoiceById);
router.put("/:id", verifyToken, updateSalesInvoice);
router.delete("/:id", verifyToken, deleteSalesInvoice);

module.exports = router;