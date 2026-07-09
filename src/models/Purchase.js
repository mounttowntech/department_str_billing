const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema(
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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    expiryDate: Date,
  },
  {
    _id: false,
  }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    invoiceNumber: {
      type: String,
      trim: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },

    purchaseStatus: {
      type: String,
      enum: ["Pending", "Received", "Cancelled"],
      default: "Received",
    },

    items: [purchaseItemSchema],

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

    transportCharge: {
      type: Number,
      default: 0,
    },

    otherCharges: {
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

    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
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

/* ===========================
   Pre Save Hook
=========================== */

purchaseSchema.pre("save", function () {

    if (!Array.isArray(this.items)) {
        this.items = [];
    }

    this.subTotal = 0;
    this.gstAmount = 0;

    this.items.forEach((item) => {

        const quantity = Number(item.quantity || 0);
        const price = Number(item.purchasePrice || 0);
        const gst = Number(item.gstPercentage || 0);

        const taxable = quantity * price;

        item.gstAmount = Number(
            ((taxable * gst) / 100).toFixed(2)
        );

        item.totalAmount = Number(
            (taxable + item.gstAmount).toFixed(2)
        );

        this.subTotal += taxable;
        this.gstAmount += item.gstAmount;
    });

    this.subTotal = Number(this.subTotal.toFixed(2));
    this.gstAmount = Number(this.gstAmount.toFixed(2));

    this.transportCharge = Number(this.transportCharge || 0);
    this.otherCharges = Number(this.otherCharges || 0);
    this.discountAmount = Number(this.discountAmount || 0);
    this.paidAmount = Number(this.paidAmount || 0);

    this.grandTotal =
        this.subTotal +
        this.gstAmount +
        this.transportCharge +
        this.otherCharges -
        this.discountAmount;

    this.grandTotal = Number(this.grandTotal.toFixed(2));

    this.dueAmount = this.grandTotal - this.paidAmount;

    if (this.dueAmount <= 0) {
        this.paymentStatus = "paid";
        this.dueAmount = 0;
    } else if (this.paidAmount > 0) {
        this.paymentStatus = "partial";
    } else {
        this.paymentStatus = "unpaid";
    }

});
/* ===========================
   Virtual
=========================== */

purchaseSchema.virtual("totalItems").get(function () {
  if (!this.items || !Array.isArray(this.items)) {
    return 0;
  }

  return this.items.length;
});

/* ===========================
   Indexes
=========================== */

purchaseSchema.index({
  purchaseNo: 1,
});

purchaseSchema.index({
  supplier: 1,
});

purchaseSchema.index({
  store: 1,
});

purchaseSchema.index({
  warehouse: 1,
});

purchaseSchema.index({
  purchaseDate: -1,
});

purchaseSchema.index({
  paymentStatus: 1,
});

purchaseSchema.index({
  purchaseStatus: 1,
});

/* ===========================
   JSON
=========================== */

purchaseSchema.set("toJSON", {
  virtuals: true,
});

purchaseSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model("Purchase", purchaseSchema);