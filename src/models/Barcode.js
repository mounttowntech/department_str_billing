const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    barcode: {
      type: String,
      required: true,
      trim: true,
    },

    skuCode: {
      type: String,
      uppercase: true,
      trim: true,
    },

    barcodeType: {
      type: String,
      enum: ["Product", "Batch", "Weight"],
      default: "Product",
    },

    status: {
      type: Boolean,
      default: true,
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
  { timestamps: true, versionKey: false }
);

schema.index({ store: 1, barcode: 1 }, { unique: true });
schema.index({ store: 1, product: 1 });
schema.index({ store: 1, variant: 1 });

module.exports = mongoose.model("Barcode", schema);