const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      unique: true,
    },
    lowStockAlert: { type: Boolean, default: true },
    expiryAlertDays: { type: Number, default: 30 },
    invoicePrintSize: {
      type: String,
      enum: ["A4", "Thermal80", "Thermal58"],
      default: "Thermal80",
    },
    roundOff: { type: Boolean, default: true },
    defaultPaymentMode: { type: String, default: "Cash" },
    loyaltyEarnPerAmount: { type: Number, default: 100 },
    loyaltyPointsPerAmount: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Settings", schema);
