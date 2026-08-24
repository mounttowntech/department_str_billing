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

    couponCode: {
      type: String,
      uppercase: true,
      trim: true,
    },

    couponAmount: {
      type: Number,
      default: 0,
      min: 0,
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
      enum: ["walk_in", "regular", "wholesale"],
      default: "walk_in",
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
   Calculate Totals (Using Async Pre-Save Hook)
========================================== */

salesInvoiceSchema.pre("save", async function () {
  let calculatedSubTotal = 0;
  let calculatedDiscount = 0;
  let calculatedTaxable = 0;
  let totalGst = 0;
  let totalQty = 0;

  if (this.items && this.items.length > 0) {
    this.items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const itemDiscount = Math.min(Math.max(Number(item.discount || 0), 0), qty * price);
      const gross = qty * price;
      const taxable = Math.max(gross - itemDiscount, 0);

      calculatedSubTotal += gross;
      calculatedDiscount += itemDiscount;
      calculatedTaxable += taxable;
      totalQty += qty;

      const gstPercentage = Number(item.gstPercentage || 0);
      const itemGst = (taxable * gstPercentage) / 100;

      // Update individual item amounts
      item.taxableAmount = Number(taxable.toFixed(2));
      item.cgstAmount = Number((itemGst / 2).toFixed(2));
      item.sgstAmount = Number((itemGst / 2).toFixed(2));
      item.gstAmount = Number(itemGst.toFixed(2));
      item.totalAmount = Number((taxable + itemGst).toFixed(2));

      totalGst += itemGst;
    });
  }

  this.subTotal = Number(calculatedSubTotal.toFixed(2));
  this.discountAmount = Number(calculatedDiscount.toFixed(2));
  this.taxableAmount = Number(calculatedTaxable.toFixed(2));
  this.totalQuantity = totalQty;
  this.totalItems = this.items?.length || 0;

  // Coupon calculations
  const safeCoupon = Math.min(Math.max(Number(this.couponAmount || 0), 0), this.taxableAmount);
  this.couponAmount = Number(safeCoupon.toFixed(2));

  const taxableAfterCoupon = Math.max(this.taxableAmount - safeCoupon, 0);
  const couponRatio = this.taxableAmount > 0 ? taxableAfterCoupon / this.taxableAmount : 0;
  
  const finalGst = totalGst * couponRatio;
  this.cgstAmount = Number((finalGst / 2).toFixed(2));
  this.sgstAmount = Number((finalGst / 2).toFixed(2));
  this.gstAmount = Number(finalGst.toFixed(2));

  const totalBeforeRound = taxableAfterCoupon + finalGst;
  this.grandTotal = Math.round(totalBeforeRound);
  this.roundOffAmount = Number((this.grandTotal - totalBeforeRound).toFixed(2));

  // Payment status & Due balance calculation
  const paid = Number(this.paidAmount || 0);
  if (this.grandTotal === 0 || paid >= this.grandTotal) {
    this.paymentStatus = "Paid";
    this.dueAmount = 0;
    this.returnAmount = Number((paid - this.grandTotal).toFixed(2));
  } else if (paid > 0) {
    this.paymentStatus = "Partial";
    this.dueAmount = Number((this.grandTotal - paid).toFixed(2));
    this.returnAmount = 0;
  } else {
    this.paymentStatus = "Pending";
    this.dueAmount = this.grandTotal;
    this.returnAmount = 0;
  }
});

/* ==========================================
   Virtual
========================================== */

salesInvoiceSchema.virtual("itemCount").get(function () {
  return this.items?.length || 0;
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
salesInvoiceSchema.index({ isDeleted: 1 });

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