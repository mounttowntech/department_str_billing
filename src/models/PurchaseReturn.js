const mongoose = require("mongoose");

const item = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    skuCode: String,
    barcode: String,
    productName: String,
    quantity: { type: Number, required: true, min: 1 },
    refundAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    returnNo: { type: String, unique: true, required: true, uppercase: true, trim: true },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    returnDate: { type: Date, default: Date.now },
    items: [item],
    refundAmount: { type: Number, default: 0 },
    reason: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

schema.pre("save", function (next) {
  this.refundAmount = (this.items || []).reduce((sum, it) => sum + Number(it.refundAmount || 0), 0);
  next();
});

module.exports = mongoose.model("PurchaseReturn", schema);
