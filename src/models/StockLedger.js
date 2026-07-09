const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      index: true,
    },

    skuCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    barcode: {
      type: String,
      trim: true,
    },

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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    beforeStock: {
      type: Number,
      required: true,
      default: 0,
    },

    afterStock: {
      type: Number,
      required: true,
      default: 0,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

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

    referenceNumber: {
      type: String,
      trim: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

   createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
}
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* -------------------------
   Indexes
------------------------- */

schema.index({ store: 1, createdAt: -1 });

schema.index({ product: 1, createdAt: -1 });

schema.index({ variant: 1, createdAt: -1 });

schema.index({ movementType: 1 });

schema.index({
  referenceModel: 1,
  referenceId: 1,
});

module.exports = mongoose.model("StockLedger", schema);