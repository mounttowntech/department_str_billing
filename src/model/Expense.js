const mongoose = require("mongoose");

const recurringSchema = new mongoose.Schema(
  {
    isRecurring: {
      type: Boolean,
      default: false,
    },

    frequency: {
      type: String,
      enum: [
        "Daily",
        "Weekly",
        "Monthly",
        "Quarterly",
        "Yearly"
      ],
      default: "Monthly",
    },

    nextDueDate: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    expenseCategory: {
      type: String,
      required: true,
      enum: [
        "Rent",
        "Electricity",
        "Water",
        "Internet",
        "Salary",
        "Transport",
        "Fuel",
        "Maintenance",
        "Office Expense",
        "Marketing",
        "Packaging",
        "Cleaning",
        "Tax",
        "Miscellaneous"
      ],
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
      min: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Card",
        "Bank Transfer",
        "Cheque",
        "Wallet"
      ],
      required: true,
    },

    receiptNumber: {
      type: String,
      default: "",
      trim: true,
    },

    billImage: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    approvalStatus: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected"
      ],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    recurring: recurringSchema,

    status: {
      type: String,
      enum: [
        "active",
        "cancelled"
      ],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
 Auto Calculate Total Amount
*/

expenseSchema.pre("save", function (next) {

  this.totalAmount =
    Number(this.amount) +
    Number(this.taxAmount);

  next();

});

/*
 Database Indexes
*/

expenseSchema.index({
  expenseNumber: 1,
});

expenseSchema.index({
  expenseCategory: 1,
});

expenseSchema.index({
  expenseDate: 1,
});

expenseSchema.index({
  approvalStatus: 1,
});

module.exports = mongoose.model(
  "Expense",
  expenseSchema
);