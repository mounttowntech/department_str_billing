const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // ======================================================
    // STORE
    // ======================================================

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    // ======================================================
    // WAREHOUSE
    // ======================================================

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },

    // ======================================================
    // BATCH
    // ======================================================

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    // ======================================================
    // PRODUCT
    // ======================================================

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    // ======================================================
    // VARIANT
    // ======================================================

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      index: true,
    },

    // ======================================================
    // SKU
    // ======================================================

    skuCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    // ======================================================
    // BARCODE
    // ======================================================

    barcode: {
      type: String,
      trim: true,
    },

    // ======================================================
    // MOVEMENT TYPE
    // ======================================================

    movementType: {
      type: String,
      required: true,

      enum: [
        "purchase",
        "sale",
        "sales_return",
        "purchase_return",
        "adjustment_in",
        "adjustment_out",
        "transfer_in",
        "transfer_out",
      ],

      index: true,
    },

    // ======================================================
    // QUANTITY
    // ======================================================

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // ======================================================
    // BEFORE STOCK
    // ======================================================

    beforeStock: {
      type: Number,
      required: true,
      default: 0,
    },

    // ======================================================
    // AFTER STOCK
    // ======================================================

    afterStock: {
      type: Number,
      required: true,
      default: 0,
    },

    // ======================================================
    // REFERENCE ID
    // ======================================================

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // ======================================================
    // REFERENCE MODEL
    // ======================================================

    referenceModel: {
      type: String,

      enum: [
        "Purchase",
        "SalesInvoice",
        "PurchaseReturn",
        "SalesReturn",
        "StockAdjustment",
        "StockTransfer",
        "OpeningStock",
      ],
    },

    // ======================================================
    // REFERENCE NUMBER
    // ======================================================

    referenceNumber: {
      type: String,
      trim: true,
    },

    // ======================================================
    // REMARKS
    // ======================================================

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    // ======================================================
    // CREATED BY
    // ======================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ======================================================
    // UPDATED BY
    // ======================================================

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ======================================================
    // SOFT DELETE
    // ======================================================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ==========================================================
   INDEXES
========================================================== */

schema.index({
  store: 1,
  createdAt: -1,
});

schema.index({
  product: 1,
  createdAt: -1,
});

schema.index({
  variant: 1,
  createdAt: -1,
});

schema.index({
  movementType: 1,
});

schema.index({
  referenceModel: 1,
  referenceId: 1,
});

schema.index({
  isDeleted: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "StockLedger",
  schema
);