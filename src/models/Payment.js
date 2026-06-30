const mongoose = require("mongoose");
const bank = new mongoose.Schema(
  {
    bankName: String,
    accountNumber: String,
    transactionId: String,
    chequeNumber: String,
    upiId: String,
    cardLastFourDigit: String,
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    paymentType: {
      type: String,
      enum: [
        "Sales",
        "Purchase",
        "Expense",
        "Customer Payment",
        "Supplier Payment",
        "Advance",
        "Refund",
      ],
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Wallet"],
      required: true,
    },
    referenceNumber: String,
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice" },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    expense: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    balanceAmount: { type: Number, default: 0 },
    returnAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Partial",
        "Completed",
        "Failed",
        "Cancelled",
        "Refunded",
      ],
      default: "Completed",
    },
    transactionDate: { type: Date, default: Date.now },
    bankDetails: bank,
    remarks: String,
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
schema.pre("save", function (next) {
  this.balanceAmount = Math.max(
    Number(this.amount || 0) - Number(this.paidAmount || 0),
    0,
  );
  this.returnAmount = Math.max(
    Number(this.paidAmount || 0) - Number(this.amount || 0),
    0,
  );
  next();
});
module.exports = mongoose.model("Payment", schema);
