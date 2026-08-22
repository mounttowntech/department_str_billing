const mongoose = require("mongoose");

const cashSessionSchema = new mongoose.Schema(
  {
    // Unique cash session number
    sessionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Store remains a MongoDB ObjectId
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    // Cashier is MANUALLY ENTERED
    // Example: CASH001, 1001, C001
    cashier: {
      type: String,
      required: true,
      trim: true,
    },

    openingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Actual cash counted when closing
    closingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // openingBalance + cashSales - expenseCash
    expectedClosingBalance: {
      type: Number,
      default: 0,
    },

    // closingBalance - expectedClosingBalance
    difference: {
      type: Number,
      default: 0,
    },

    cashSales: {
      type: Number,
      default: 0,
      min: 0,
    },

    expenseCash: {
      type: Number,
      default: 0,
      min: 0,
    },

    openedAt: {
      type: Date,
      default: Date.now,
    },

    closedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },

    notes: {
      type: String,
      trim: true,
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
  }
);

// Only one OPEN session for the same store + cashier
cashSessionSchema.index(
  {
    store: 1,
    cashier: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "open",
    },
  }
);

module.exports = mongoose.model(
  "CashSession",
  cashSessionSchema
);