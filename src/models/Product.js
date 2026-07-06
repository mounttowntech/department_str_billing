const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },

    productCode: { type: String, unique: true, required: true, uppercase: true, trim: true },
    productName: { type: String, required: true, trim: true },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "DepartmentCategory", required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "DepartmentSubCategory" },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    taxSetting: { type: mongoose.Schema.Types.ObjectId, ref: "TaxSetting" },

    hsnCode: { type: String, trim: true },
    description: String,
    image: String,

    productType: {
      type: String,
      enum: ["department_store", "restaurant", "garments", "general"],
      default: "department_store",
    },

    isBatchRequired: { type: Boolean, default: false },
    isExpiryRequired: { type: Boolean, default: false },
    allowDiscount: { type: Boolean, default: true },
    allowReturn: { type: Boolean, default: true },

    totalStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 5, min: 0 },

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false }
);

schema.virtual("isLowStock").get(function () {
  return Number(this.totalStock || 0) <= Number(this.minimumStock || 0);
});

schema.index({ store: 1, productName: 1 });
schema.index({ store: 1, category: 1 });
schema.set("toJSON", { virtuals: true });
schema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", schema);
