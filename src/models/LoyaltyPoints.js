const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice" },
    points: { type: Number, default: 0 },
    type: { type: String, enum: ["earn", "redeem", "adjust"], required: true },
    remarks: String,
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("LoyaltyPoints", schema);
