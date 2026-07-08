const mongoose = require("mongoose");

/* ==========================================
   Sales Return Item Schema
========================================== */

const salesReturnItemSchema = new mongoose.Schema(
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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    salesPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxableAmount: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

/* ==========================================
   Sales Return Schema
========================================== */

const salesReturnSchema = new mongoose.Schema(
  {
    returnNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesInvoice",
      required: true,
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

    returnDate: {
      type: Date,
      default: Date.now,
    },

    returnType: {
      type: String,
      enum: ["refund", "exchange", "credit_note"],
      default: "refund",
    },

    refundMethod: {
      type: String,
      enum: ["cash", "upi", "card", "wallet", "credit"],
      default: "cash",
    },

    returnStatus: {
  type: String,
  enum: ["none", "returned", "cancelled"], // <-- whatever the actual list is
  default: "none",
},

    items: {
      type: [salesReturnItemSchema],
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

    taxableAmount: {
      type: Number,
      default: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
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
  },
);

/* ==========================================
   Calculate Totals
========================================== */

salesReturnSchema.pre("save", function () {
  this.totalItems = 0;
  this.totalQuantity = 0;
  this.taxableAmount = 0;
  this.gstAmount = 0;
  this.refundAmount = 0;

  if (!Array.isArray(this.items)) {
    this.items = [];
  }

  this.totalItems = this.items.length;

  this.items = this.items.map((item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.salesPrice || 0);
    const discount = Number(item.discount || 0);
    const gstPercent = Number(item.gstPercentage || 0);

    const taxable = Math.max(qty * price - discount, 0);
    const gst = Number(((taxable * gstPercent) / 100).toFixed(2));
    const refund = Number((taxable + gst).toFixed(2));

    item.taxableAmount = taxable;
    item.gstAmount = gst;
    item.refundAmount = refund;

    this.totalQuantity += qty;
    this.taxableAmount += taxable;
    this.gstAmount += gst;
    this.refundAmount += refund;

    return item;
  });

  this.taxableAmount = Number(this.taxableAmount.toFixed(2));
  this.gstAmount = Number(this.gstAmount.toFixed(2));
  this.refundAmount = Number(this.refundAmount.toFixed(2));
});

/* ==========================================
   Virtuals
========================================== */

salesReturnSchema.virtual("totalRefund").get(function () {
  return this.refundAmount;
});

/* ==========================================
   Indexes
========================================== */

salesReturnSchema.index({
  returnNo: 1,
});

salesReturnSchema.index({
  invoice: 1,
});

salesReturnSchema.index({
  customer: 1,
});

salesReturnSchema.index({
  store: 1,
});

salesReturnSchema.index({
  warehouse: 1,
});

salesReturnSchema.index({
  returnDate: -1,
});

salesReturnSchema.index({
  returnStatus: 1,
});

salesReturnSchema.index({
  createdAt: -1,
});

salesReturnSchema.index({
  isDeleted: 1,
});

/* ==========================================
   JSON Options
========================================== */

salesReturnSchema.set("toJSON", {
  virtuals: true,
});

salesReturnSchema.set("toObject", {
  virtuals: true,
});

/* ==========================================
   Export
========================================== */

module.exports = mongoose.model("SalesReturn", salesReturnSchema);
