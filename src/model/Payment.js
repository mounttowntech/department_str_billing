const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    chequeNumber: {
      type: String,
      default: "",
      trim: true,
    },

    upiId: {
      type: String,
      default: "",
      trim: true,
    },

    cardLastFourDigit: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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

    referenceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesInvoice",
    },

    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },

    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

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

    transactionDate: {
      type: Date,
      default: Date.now,
    },

    bankDetails: bankDetailsSchema,

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/*
 Auto Calculate Balance
*/

paymentSchema.pre("save", function (next) {
  this.balanceAmount = this.amount - this.paidAmount;

  next();
});

/*
 Database Indexes
*/

paymentSchema.index({
  paymentNumber: 1,
});

paymentSchema.index({
  paymentType: 1,
});

paymentSchema.index({
  paymentMode: 1,
});

paymentSchema.index({
  paymentStatus: 1,
});

paymentSchema.index({
  transactionDate: 1,
});

module.exports = mongoose.model("Payment", paymentSchema);
