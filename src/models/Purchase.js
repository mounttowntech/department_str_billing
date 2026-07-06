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
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    purchasePrice: { type: Number, required: true, min: 0 },
    gstPercentage: { type: Number, default: 0, min: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    expiryDate: Date,
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    purchaseNo: { type: String, unique: true, required: true, uppercase: true, trim: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    purchaseDate: { type: Date, default: Date.now },

    items: [item],
    subTotal: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["paid", "partial", "unpaid"], default: "unpaid" },

    remarks: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

schema.pre("save", function (next) {
  this.subTotal = 0;
  this.gstAmount = 0;

  this.items = (this.items || []).map((it) => {
    const qty = Number(it.quantity || 0);
    const price = Number(it.purchasePrice || 0);
    const gstPercent = Number(it.gstPercentage || 0);
    const taxable = qty * price;
    const gst = Number(((taxable * gstPercent) / 100).toFixed(2));
    it.gstAmount = gst;
    it.totalAmount = Number((taxable + gst).toFixed(2));
    this.subTotal += taxable;
    this.gstAmount += gst;
    return it;
  });

  this.grandTotal = Number((this.subTotal + this.gstAmount).toFixed(2));
  this.dueAmount = Math.max(this.grandTotal - Number(this.paidAmount || 0), 0);
  if (this.dueAmount === 0 && Number(this.paidAmount || 0) >= this.grandTotal) this.paymentStatus = "paid";
  else if (Number(this.paidAmount || 0) > 0) this.paymentStatus = "partial";
  else this.paymentStatus = "unpaid";
  next();
});

schema.index({ store: 1, purchaseDate: -1 });
module.exports = mongoose.model("Purchase", schema);
