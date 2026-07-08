const express = require("express");
const router = express.Router();

const holdBillController = require("../controllers/HoldBillController");

// Create Hold Bill
router.post(
  "/create",
  holdBillController.createHoldBill
);

// Get All Hold Bills
router.get(
  "/all",
  holdBillController.getAllHoldBills
);

// Get Hold Bill By ID
router.get(
  "/:id",
  holdBillController.getHoldBillById
);

// Update Hold Bill
router.put(
  "/update/:id",
  holdBillController.updateHoldBill
);

// Convert Hold Bill to Sales Invoice
router.post(
  "/convert/:id",
  holdBillController.convertHoldBillToInvoice
);

// Delete Hold Bill (Soft Delete)
router.delete(
  "/delete/:id",
  holdBillController.deleteHoldBill
);

module.exports = router;