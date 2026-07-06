const mongoose = require("mongoose");

const item = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    skuCode: String,
    barcode: String,
    productName: String,
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    packSize: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    gstPercentage: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    expiryDate: Date,
    hsnCode: String,
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true, required: true, uppercase: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    invoiceDate: { type: Date, default: Date.now },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },

    billingType: { type: String, enum: ["pos", "online", "manual"], default: "pos" },
    customerType: { type: String, enum: ["walk_in", "registered"], default: "walk_in" },

    items: [item],
    subTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    roundOffAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },
    returnAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    paymentMethod: { type: String, enum: ["cash", "upi", "card", "wallet", "credit", "split"], default: "cash" },
    paymentStatus: { type: String, enum: ["paid", "partial", "pending"], default: "pending" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    returnStatus: { type: String, enum: ["none", "partial", "returned"], default: "none" },
    remarks: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

schema.pre("save", function (next) {
  this.subTotal = 0;
  this.gstAmount = 0;
  this.taxableAmount = 0;

  this.items = (this.items || []).map((it) => {
    const qty = Number(it.quantity || 0);
    const price = Number(it.price || 0);
    const discount = Number(it.discount || 0);
    const gstPercent = Number(it.gstPercentage || 0);
    const taxable = Math.max(qty * price - discount, 0);
    const gst = Number(((taxable * gstPercent) / 100).toFixed(2));
    it.taxableAmount = taxable;
    it.gstAmount = gst;
    it.totalAmount = Number((taxable + gst).toFixed(2));
    this.subTotal += qty * price;
    this.taxableAmount += taxable;
    this.gstAmount += gst;
    return it;
  });

  const netTotal = this.taxableAmount + this.gstAmount - Number(this.discountAmount || 0);
  const rounded = Math.round(netTotal);
  this.roundOffAmount = Number((rounded - netTotal).toFixed(2));
  this.grandTotal = rounded;
  this.dueAmount = Math.max(this.grandTotal - Number(this.paidAmount || 0), 0);
  this.returnAmount = Math.max(Number(this.paidAmount || 0) - this.grandTotal, 0);

  if (this.dueAmount === 0 && Number(this.paidAmount || 0) >= this.grandTotal) this.paymentStatus = "paid";
  else if (Number(this.paidAmount || 0) > 0) this.paymentStatus = "partial";
  else this.paymentStatus = "pending";

  next();
});

schema.index({ store: 1, invoiceDate: -1 });

module.exports = mongoose.model("SalesInvoice", schema);
