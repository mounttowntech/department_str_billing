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
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    purchasePrice: Number,
    gstPercentage: Number,
    gstAmount: Number,
    totalAmount: Number,
    expiryDate: Date,
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    purchaseNo: { type: String, unique: true, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    purchaseDate: { type: Date, default: Date.now },
    items: [item],
    subTotal: Number,
    gstAmount: Number,
    grandTotal: Number,
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Purchase", schema);
