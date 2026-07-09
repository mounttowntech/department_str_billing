const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    sessionNo: { type: String, required: true, unique: true },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    openingBalance: { type: Number, default: 0, min: 0 },
    closingBalance: { type: Number, default: 0, min: 0 }, // actual counted cash at close
    expectedClosingBalance: { type: Number, default: 0 }, // opening + cashSales - expenseCash
    difference: { type: Number, default: 0 }, // closingBalance - expectedClosingBalance
    cashSales: { type: Number, default: 0, min: 0 },
    expenseCash: { type: Number, default: 0, min: 0 },
    openedAt: { type: Date, default: Date.now },
    closedAt: Date,
    status: { type: String, enum: ["open", "closed"], default: "open" },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

// Only one open session per store+cashier at a time
schema.index(
  { store: 1, cashier: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "open" } }
);

module.exports = mongoose.model("CashSession", schema);