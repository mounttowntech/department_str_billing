const mongoose = require("mongoose");

/* ==========================================
   Sales Invoice Item Schema
========================================== */

const salesInvoiceItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    skuCode: {
      type: String,
      trim: true,
    },

    barcode: {
      type: String,
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },

    packSize: {
      type: String,
      trim: true,
    },

    hsnCode: {
      type: String,
      trim: true,
    },

    expiryDate: Date,

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstPercentage: {
      type: Number,
      default: 0,
    },

    taxableAmount: {
      type: Number,
      default: 0,
    },

    cgstAmount: {
      type: Number,
      default: 0,
    },

    sgstAmount: {
      type: Number,
      default: 0,
    },

    igstAmount: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

/* ==========================================
   Sales Invoice Schema
========================================== */

const salesInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    billingType: {
      type: String,
      enum: ["POS", "Online", "Manual"],
      default: "POS",
    },

    customerType: {
      type: String,
      enum: ["Walk-In", "Registered"],
      default: "Walk-In",
    },

    items: {
      type: [salesInvoiceItemSchema],
      default: [],
    },

    totalItems: {
      type: Number,
      default: 0,
    },

    totalQuantity: {
      type: Number,
      default: 0,
    },

    subTotal: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    taxableAmount: {
      type: Number,
      default: 0,
    },

    cgstAmount: {
      type: Number,
      default: 0,
    },

    sgstAmount: {
      type: Number,
      default: 0,
    },

    igstAmount: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    roundOffAmount: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
    },

    returnAmount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Card",
        "Wallet",
        "Credit",
        "Split",
      ],
      default: "Cash",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Partial", "Paid"],
      default: "Pending",
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    returnStatus: {
      type: String,
      enum: ["None", "Partial", "Returned"],
      default: "None",
    },

    remarks: {
      type: String,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ==========================================
   Calculate Totals
========================================== */

salesInvoiceSchema.pre("save", function () {
  this.subTotal = 0;
  this.discountAmount = 0;
  this.taxableAmount = 0;
  this.cgstAmount = 0;
  this.sgstAmount = 0;
  this.igstAmount = 0;
  this.gstAmount = 0;
  this.totalItems = this.items.length;
  this.totalQuantity = 0;

  this.items.forEach((item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const discount = Number(item.discount || 0);

    const gross = qty * price;
    const taxable = gross - discount;

    const gst = (taxable * Number(item.gstPercentage || 0)) / 100;

    item.taxableAmount = Number(taxable.toFixed(2));
    item.gstAmount = Number(gst.toFixed(2));

    item.cgstAmount = Number((gst / 2).toFixed(2));
    item.sgstAmount = Number((gst / 2).toFixed(2));
    item.igstAmount = 0;

    item.totalAmount = Number((taxable + gst).toFixed(2));

    this.totalQuantity += qty;
    this.subTotal += gross;
    this.discountAmount += discount;
    this.taxableAmount += taxable;
    this.cgstAmount += item.cgstAmount;
    this.sgstAmount += item.sgstAmount;
    this.igstAmount += item.igstAmount;
    this.gstAmount += gst;
  });

  const total = this.taxableAmount + this.gstAmount;

  this.roundOffAmount = Number(
    (Math.round(total) - total).toFixed(2)
  );

  this.grandTotal = Math.round(total);

  this.dueAmount = Math.max(
    this.grandTotal - Number(this.paidAmount || 0),
    0
  );

  this.returnAmount = Math.max(
    Number(this.paidAmount || 0) - this.grandTotal,
    0
  );

  if (this.dueAmount === 0 && this.paidAmount >= this.grandTotal)
    this.paymentStatus = "Paid";
  else if (this.paidAmount > 0)
    this.paymentStatus = "Partial";
  else
    this.paymentStatus = "Pending";


});

/* ==========================================
   Virtual
========================================== */

salesInvoiceSchema.virtual("invoiceItems").get(function () {
  return this.items.length;
});

/* ==========================================
   Indexes
========================================== */

salesInvoiceSchema.index({ invoiceNo: 1 });
salesInvoiceSchema.index({ customer: 1 });
salesInvoiceSchema.index({ store: 1 });
salesInvoiceSchema.index({ warehouse: 1 });
salesInvoiceSchema.index({ invoiceDate: -1 });
salesInvoiceSchema.index({ paymentStatus: 1 });
salesInvoiceSchema.index({ billingType: 1 });

/* ==========================================
   JSON
========================================== */

salesInvoiceSchema.set("toJSON", {
  virtuals: true,
});

salesInvoiceSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model(
  "SalesInvoice",
  salesInvoiceSchema
);