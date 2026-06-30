const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    customerCode: { type: String, unique: true, uppercase: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true },
    gstNumber: String,
    totalPurchaseAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Customer", schema);
