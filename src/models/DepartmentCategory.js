const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    categoryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Image uploaded from React frontend
    imageURL: {
      type: String,
      trim: true,
      default: null,
    },

    icon: {
      type: String,
      trim: true,
      default: null,
    },

    departmentType: {
      type: String,
      enum: ["department_store", "restaurant", "garments", "general"],
      default: "department_store",
    },

    taxSetting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxSetting",
    },

    displayOrder: {
      type: Number,
      default: 1,
    },

    isFeatured: {
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

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique category code inside a store
schema.index(
  { store: 1, categoryCode: 1 },
  { unique: true }
);

// Unique category name inside a store
schema.index(
  { store: 1, categoryName: 1 },
  { unique: true }
);

schema.index({
  store: 1,
  departmentType: 1,
});

module.exports = mongoose.model(
  "DepartmentCategory",
  schema
);