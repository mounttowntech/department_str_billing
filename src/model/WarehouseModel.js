const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    warehouseCode: {
      type: String,
      required: true,
      unique: true,
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

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    phone: String,

    email: String,

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
  },
);

warehouseSchema.index({
  warehouseCode: 1,
});

warehouseSchema.index({
  warehouseName: 1,
});

module.exports = mongoose.model("Warehouse", warehouseSchema);
