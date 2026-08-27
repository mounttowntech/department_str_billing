const mongoose = require("mongoose");

const recurringSchema = new mongoose.Schema(
  {
    isRecurring: {
      type: Boolean,
      default: false,
    },

    frequency: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
      default: "Monthly",
    },

    nextDueDate: Date,
  },
  {
    _id: false,
  },
);

const schema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    expenseCategory: {
      type: String,
      required: true,
      trim: true,
    },

    expenseDate: {
      type: Date,
      default: Date.now,
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

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    taxSetting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxSetting",
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer", "Cheque", "Wallet"],
      required: true,
    },

    receiptNumber: String,

    billImage: String,

    description: String,

    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    recurring: recurringSchema,

    status: {
      type: Boolean,
      default: true,
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

schema.pre("save", function () {
  this.totalAmount = Number(this.amount || 0) + Number(this.taxAmount || 0);
});

// Fix findOneAndUpdate calculation
schema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update.amount || update.taxAmount) {
    update.totalAmount =
      Number(update.amount || 0) + Number(update.taxAmount || 0);
  }
});

module.exports = mongoose.model("Expense", schema);
