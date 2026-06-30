const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    subCategoryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentCategory",
      required: true,
    },
    subCategoryName: { type: String, required: true },
    displayName: String,
    description: String,
    image: String,
    icon: String,
    taxSetting: { type: mongoose.Schema.Types.ObjectId, ref: "TaxSetting" },
    shelfLifeDays: { type: Number, default: 0 },
    requiresBatch: { type: Boolean, default: false },
    requiresExpiry: { type: Boolean, default: false },
    allowDiscount: { type: Boolean, default: true },
    allowReturn: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("DepartmentSubCategory", schema);
