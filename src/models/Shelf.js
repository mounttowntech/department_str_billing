const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    shelfCode: { type: String, required: true, unique: true, uppercase: true },
    shelfName: { type: String, required: true },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    rackNumber: { type: String, required: true },
    floorNumber: { type: Number, default: 1 },
    section: String,
    storageType: {
      type: String,
      enum: ["Normal", "Cold", "Frozen", "Dry Storage"],
      default: "Normal",
    },
    maximumCapacity: { type: Number, default: 0 },
    currentCapacity: { type: Number, default: 0 },
    remarks: String,
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Shelf", schema);
