const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    adjustmentNo: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    skuCode: String,
    adjustmentType: {
      type: String,
      enum: ["increase", "decrease"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    beforeStock: Number,
    afterStock: Number,
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "reversed"],
      default: "active",
    },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reversedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ store: 1, createdAt: -1 });
schema.index({ variant: 1, createdAt: -1 });

module.exports = mongoose.model("StockAdjustment", schema);