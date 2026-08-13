const mongoose = require("mongoose");

const stockAdjustmentSchema = new mongoose.Schema(
  {
    adjustmentNo: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      trim: true,
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

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    skuCode: {
      type: String,
      trim: true,
    },

    adjustmentType: {
      type: String,
      enum: ["increase", "decrease"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    beforeStock: {
      type: Number,
      default: 0,
    },

    afterStock: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      trim: true,
    },

    // ======================================================
    // DELETE / STATUS
    // ======================================================

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
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

    // ======================================================
    // USERS
    // ======================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
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

stockAdjustmentSchema.index({
  store: 1,
  createdAt: -1,
});

stockAdjustmentSchema.index({
  variant: 1,
  createdAt: -1,
});

stockAdjustmentSchema.index({
  isDeleted: 1,
});

module.exports = mongoose.model(
  "StockAdjustment",
  stockAdjustmentSchema
);