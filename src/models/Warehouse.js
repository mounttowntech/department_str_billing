const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    warehouseCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    warehouseName: {
      type: String,
      required: true,
      trim: true,
    },

    warehouseType: {
      type: String,
      enum: [
        "Main Warehouse",
        "Branch Warehouse",
        "Cold Storage",
        "Distribution Center",
      ],
      default: "Main Warehouse",
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      district: String,
      state: String,
      country: {
        type: String,
        default: "India",
      },
      pincode: String,
    },

    storageCapacity: {
      type: Number,
      default: 0,
    },

    currentStockValue: {
      type: Number,
      default: 0,
    },

    temperatureZone: {
      type: String,
      enum: ["Normal", "Cold", "Frozen"],
      default: "Normal",
    },

    allowNegativeStock: {
      type: Boolean,
      default: false,
    },

    remarks: String,

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

schema.index({ store: 1, warehouseCode: 1 }, { unique: true });
schema.index({ store: 1, warehouseName: 1 });
schema.index({ store: 1, status: 1 });

module.exports = mongoose.model("Warehouse", schema);