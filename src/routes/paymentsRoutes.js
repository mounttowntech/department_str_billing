const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/PaymentController");

// Create Payment
router.post(
  "/create",
  paymentController.createPayment
);

// Get All Payments
router.get(
  "/all",
  paymentController.getAllPayments
);

// Get Single Payment
router.get(
  "/:id",
  paymentController.getPaymentById
);

// Update Payment
router.put(
  "/update/:id",
  paymentController.updatePayment
);

// Soft Delete Payment
router.delete(
  "/delete/:id",
  paymentController.deletePayment
);

module.exports = router;