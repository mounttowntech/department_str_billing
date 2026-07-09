const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      trim: true,
      default: "",
    },

    accountHolder: {
      type: String,
      trim: true,
      default: "",
    },

    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },

    ifscCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
    },

    transactionId: {
      type: String,
      trim: true,
      default: "",
    },

    chequeNumber: {
      type: String,
      trim: true,
      default: "",
    },

    upiId: {
      type: String,
      trim: true,
      default: "",
    },

    cardLastFourDigit: {
      type: String,
      trim: true,
      maxlength: 4,
      default: "",
    },

    branchName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
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
      trim: true,
      default: "",
    },

    transactionDate: {
      type: Date,
      default: Date.now,
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

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
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
    },

    returnAmount: {
      type: Number,
      default: 0,
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
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },

    remarks: {
      type: String,

      trim: true,

      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",
    },

    isDeleted: {
      type: Boolean,

      default: false,
    },
  },

  {
    timestamps: true,

    versionKey: false,
  },
);

paymentSchema.pre("save", async function () {
  try {
    /* Generate only for new documents */

    if (this.isNew && !this.paymentNumber) {
      const lastPayment = await this.constructor

        .findOne()

        .sort({ createdAt: -1 })

        .select("paymentNumber");

      let nextNumber = 1;

      if (lastPayment && lastPayment.paymentNumber) {
        const number = parseInt(lastPayment.paymentNumber.replace(/\D/g, ""));

        nextNumber = (number || 0) + 1;
      }

      this.paymentNumber = `PAY${String(nextNumber).padStart(6, "0")}`;
    }
  } catch (error) {
    next(error);
  }
});

paymentSchema.pre("save", function () {
  this.amount = Number(this.amount || 0);

  this.paidAmount = Number(this.paidAmount || 0);

  this.balanceAmount = Math.max(
    this.amount - this.paidAmount,

    0,
  );

  this.returnAmount = Math.max(
    this.paidAmount - this.amount,

    0,
  );

  if (this.balanceAmount === 0 && this.paidAmount >= this.amount) {
    this.paymentStatus = "Completed";
  } else if (this.paidAmount > 0) {
    this.paymentStatus = "Partial";
  } else {
    this.paymentStatus = "Pending";
  }

 
});

paymentSchema.virtual("isFullyPaid").get(function () {
  return this.balanceAmount === 0;
});

paymentSchema.virtual("paymentSummary").get(function () {
  return `${this.paymentMode} - ₹${this.paidAmount}`;
});

paymentSchema.index({
  paymentNumber: 1,
});

paymentSchema.index({
  paymentStatus: 1,
});

paymentSchema.index({
  paymentType: 1,
});

paymentSchema.index({
  paymentMode: 1,
});

paymentSchema.index({
  transactionDate: -1,
});

paymentSchema.index({
  customer: 1,
});

paymentSchema.index({
  supplier: 1,
});

paymentSchema.index({
  invoice: 1,
});

paymentSchema.index({
  purchase: 1,
});

paymentSchema.index({
  expense: 1,
});

paymentSchema.index({
  store: 1,
});

paymentSchema.index({
  createdAt: -1,
});

paymentSchema.index({
  isDeleted: 1,
});

paymentSchema.set("toJSON", {
  virtuals: true,
});

paymentSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model(
  "Payment",

  paymentSchema,
);
