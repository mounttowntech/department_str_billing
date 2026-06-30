const mongoose = require("mongoose");
const item = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    skuCode: String,
    barcode: String,
    productName: String,
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    packSize: String,
    quantity: Number,
    price: Number,
    discount: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 0 },
    gstAmount: Number,
    totalAmount: Number,
    expiryDate: Date,
    hsnCode: String,
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    invoiceNo: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    invoiceDate: { type: Date, default: Date.now },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    items: [item],
    subTotal: Number,
    discountAmount: { type: Number, default: 0 },
    gstAmount: Number,
    grandTotal: Number,
    paidAmount: { type: Number, default: 0 },
    returnAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "wallet", "credit", "split"],
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending"],
      default: "pending",
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    remarks: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("SalesInvoice", schema);
