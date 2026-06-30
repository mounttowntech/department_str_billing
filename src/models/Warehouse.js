const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    warehouseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    warehouseName: { type: String, required: true },
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
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    phone: String,
    email: String,
    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      district: String,
      state: String,
      country: { type: String, default: "India" },
      pincode: String,
    },
    storageCapacity: { type: Number, default: 0 },
    currentStockValue: { type: Number, default: 0 },
    temperatureZone: {
      type: String,
      enum: ["Normal", "Cold", "Frozen"],
      default: "Normal",
    },
    allowNegativeStock: { type: Boolean, default: false },
    remarks: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Warehouse", schema);
