const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Store
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    // Product Information
    productCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    // Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentCategory",
      required: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentSubCategory",
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    taxSetting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxSetting",
    },

    // Product Details
    hsnCode: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    // Inventory Settings
    isBatchRequired: {
      type: Boolean,
      default: false,
    },

    isExpiryRequired: {
      type: Boolean,
      default: false,
    },

    allowDiscount: {
      type: Boolean,
      default: true,
    },

    allowReturn: {
      type: Boolean,
      default: true,
    },

    // ===========================
    // STOCK INFORMATION
    // ===========================

    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumStock: {
      type: Number,
      default: 5,
      min: 0,
    },

    // ===========================
    // SALES INFORMATION
    // ===========================

    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalSalesAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastSoldDate: {
      type: Date,
      default: null,
    },

    // ===========================
    // STATUS
    // ===========================

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // ===========================
    // AUDIT
    // ===========================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ===========================
// Virtuals
// ===========================

productSchema.virtual("isLowStock").get(function () {
  return this.totalStock <= this.minimumStock;
});

// ===========================
// Indexes
// ===========================

productSchema.index(
  {
    store: 1,
    productCode: 1,
  },
  {
    unique: true,
  },
);

productSchema.index({
  store: 1,
  productName: 1,
});

productSchema.index({
  store: 1,
  category: 1,
});

productSchema.index({
  store: 1,
  brand: 1,
});

productSchema.index({
  totalSold: -1,
});

productSchema.index({
  totalSalesAmount: -1,
});

productSchema.index({
  lastSoldDate: -1,
});

// ===========================
// JSON
// ===========================

productSchema.set("toJSON", {
  virtuals: true,
});

productSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model("Product", productSchema);
