const mongoose = require("mongoose");

const purchaseReturnItemSchema = new mongoose.Schema(
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

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNo: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
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

    returnDate: {
      type: Date,
      default: Date.now,
    },

    returnStatus: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Completed",
      ],
      default: "Pending",
    },

    items: {
      type: [purchaseReturnItemSchema],
      default: [],
    },

    totalQuantity: {
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
  }
);

purchaseReturnSchema.pre("save", async function () {
  this.totalQuantity = 0;
  this.refundAmount = 0;

  if (!Array.isArray(this.items)) {
    this.items = [];
  }

  for (const item of this.items) {
    this.totalQuantity += Number(item.quantity || 0);
    this.refundAmount += Number(item.refundAmount || 0);
  }

  this.refundAmount = Number(this.refundAmount.toFixed(2));
});
/* ==========================================
   Virtual Fields
========================================== */

purchaseReturnSchema.virtual("totalItems").get(function () {
  return Array.isArray(this.items) ? this.items.length : 0;
});

/* ==========================================
   Indexes
========================================== */

purchaseReturnSchema.index({
  returnNo: 1,
});

purchaseReturnSchema.index({
  purchase: 1,
});

purchaseReturnSchema.index({
  supplier: 1,
});

purchaseReturnSchema.index({
  store: 1,
});

purchaseReturnSchema.index({
  warehouse: 1,
});

purchaseReturnSchema.index({
  returnStatus: 1,
});

purchaseReturnSchema.index({
  returnDate: -1,
});

purchaseReturnSchema.index({
  createdAt: -1,
});

/* ==========================================
   JSON & Object
========================================== */

purchaseReturnSchema.set("toJSON", {
  virtuals: true,
});

purchaseReturnSchema.set("toObject", {
  virtuals: true,
});

/* ==========================================
   Export
========================================== */

module.exports = mongoose.model(
  "PurchaseReturn",
  purchaseReturnSchema
);