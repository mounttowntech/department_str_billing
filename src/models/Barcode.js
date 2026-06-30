const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    barcode: { type: String, unique: true, required: true },
    skuCode: String,
    barcodeType: {
      type: String,
      enum: ["Product", "Batch", "Weight"],
      default: "Product",
    },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Barcode", schema);
