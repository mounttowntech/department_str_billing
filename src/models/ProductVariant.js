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
      required: true,
    },

    skuCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    barcode: {
      type: String,
      required: true,
      trim: true,
    },

    variantName: {
      type: String,
      trim: true,
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },

    packSize: {
      type: String,
      trim: true,
    },

    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumStock: {
      type: Number,
      default: 5,
      min: 0,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },

    shelf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelf",
    },

    imageUrls: [
      {
        type: String,
      },
    ],

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

schema.virtual("isLowStock").get(function () {
  return Number(this.currentStock || 0) <= Number(this.minimumStock || 0);
});

schema.virtual("stockStatus").get(function () {
  if (Number(this.currentStock || 0) <= 0) return "Out of Stock";
  if (Number(this.currentStock || 0) <= Number(this.minimumStock || 0)) {
    return "Low Stock";
  }
  return "In Stock";
});

schema.index({ store: 1, skuCode: 1 }, { unique: true });
schema.index({ store: 1, barcode: 1 }, { unique: true });
schema.index({ store: 1, product: 1 });
schema.index({ store: 1, status: 1 });

schema.set("toJSON", { virtuals: true });
schema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ProductVariant", schema);