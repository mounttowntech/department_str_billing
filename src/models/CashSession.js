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
    openingBalance: { type: Number, default: 0 },
    closingBalance: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    expenseCash: { type: Number, default: 0 },
    openedAt: { type: Date, default: Date.now },
    closedAt: Date,
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("CashSession", schema);
