const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    holdNo: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: [mongoose.Schema.Types.Mixed],
    subTotal: Number,
    grandTotal: Number,
    remarks: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("HoldBill", schema);
