const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    skuCode: { type: String, unique: true, required: true, uppercase: true },
    barcode: { type: String, unique: true, required: true },
    variantName: String,
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    packSize: String,
    weight: Number,
    size: String,
    color: String,
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    mrp: { type: Number, required: true },
    gstPercentage: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    shelf: { type: mongoose.Schema.Types.ObjectId, ref: "Shelf" },
    imageUrls: [String],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("ProductVariant", schema);
