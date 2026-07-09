const mongoose = require("mongoose");

/* ==========================================
   Hold Bill Item Schema
========================================== */

const holdBillItemSchema = new mongoose.Schema(
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
   Hold Bill Schema
========================================== */

const holdBillSchema = new mongoose.Schema(
  {
    holdNo: {
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

    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    salesInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesInvoice",
    },

    items: {
      type: [holdBillItemSchema],
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

    gstAmount: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Hold", "Converted", "Cancelled"],
      default: "Hold",
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

holdBillSchema.pre("save", function () {

  this.totalItems = 0;
  this.totalQuantity = 0;
  this.subTotal = 0;
  this.gstAmount = 0;
  this.discountAmount = 0;
  this.grandTotal = 0;

  if (!Array.isArray(this.items)) {
    this.items = [];
  }

  this.totalItems = this.items.length;

  this.items = this.items.map((item) => {

    const qty = Number(item.quantity || 0);
    const price = Number(item.salesPrice || 0);
    const discount = Number(item.discount || 0);
    const gstPercent = Number(item.gstPercentage || 0);

    const taxable = Math.max((qty * price) - discount, 0);

    const gst = Number(
      ((taxable * gstPercent) / 100).toFixed(2)
    );

    const total = Number(
      (taxable + gst).toFixed(2)
    );

    item.taxableAmount = taxable;
    item.gstAmount = gst;
    item.totalAmount = total;

    this.totalQuantity += qty;
    this.subTotal += taxable;
    this.gstAmount += gst;
    this.discountAmount += discount;
    this.grandTotal += total;

    return item;
  });

  this.subTotal = Number(this.subTotal.toFixed(2));
  this.gstAmount = Number(this.gstAmount.toFixed(2));
  this.discountAmount = Number(this.discountAmount.toFixed(2));
  this.grandTotal = Number(this.grandTotal.toFixed(2));

});

/* ==========================================
   Virtual
========================================== */

holdBillSchema.virtual("totalBillAmount").get(function () {
  return this.grandTotal;
});

/* ==========================================
   Indexes
========================================== */

holdBillSchema.index({ holdNo: 1 });
holdBillSchema.index({ customer: 1 });
holdBillSchema.index({ store: 1 });
holdBillSchema.index({ status: 1 });
holdBillSchema.index({ createdAt: -1 });
holdBillSchema.index({ isDeleted: 1 });

/* ==========================================
   JSON
========================================== */

holdBillSchema.set("toJSON", {
  virtuals: true,
});

holdBillSchema.set("toObject", {
  virtuals: true,
});

/* ==========================================
   Export
========================================== */

module.exports = mongoose.model("HoldBill", holdBillSchema);