const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
    },
    productName: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentCategory",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentSubCategory",
    },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    taxSetting: { type: mongoose.Schema.Types.ObjectId, ref: "TaxSetting" },
    hsnCode: String,
    description: String,
    isBatchRequired: { type: Boolean, default: false },
    isExpiryRequired: { type: Boolean, default: false },
    allowDiscount: { type: Boolean, default: true },
    allowReturn: { type: Boolean, default: true },
    totalStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Product", schema);
