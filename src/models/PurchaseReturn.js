const mongoose = require("mongoose");
const item = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    skuCode: String,
    barcode: String,
    productName: String,
    quantity: Number,
    refundAmount: Number,
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    returnNo: { type: String, unique: true, required: true },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    returnDate: { type: Date, default: Date.now },
    items: [item],
    refundAmount: Number,
    reason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("PurchaseReturn", schema);
