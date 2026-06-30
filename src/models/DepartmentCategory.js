const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    categoryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    categoryName: { type: String, required: true, unique: true },
    displayName: String,
    description: String,
    image: String,
    icon: String,
    departmentType: { type: String, default: "Others" },
    taxSetting: { type: mongoose.Schema.Types.ObjectId, ref: "TaxSetting" },
    displayOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    allowDiscount: { type: Boolean, default: true },
    allowReturn: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("DepartmentCategory", schema);
