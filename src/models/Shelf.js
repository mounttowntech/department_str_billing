const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    shelfCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    shelfName: {
      type: String,
      required: true,
      trim: true,
    },

    rackNumber: {
      type: String,
      required: true,
      trim: true,
    },

    floorNumber: {
      type: Number,
      default: 1,
      min: 0,
    },

    section: {
      type: String,
      trim: true,
    },

    storageType: {
      type: String,
      enum: ["Normal", "Cold", "Frozen", "Dry Storage"],
      default: "Normal",
    },

    maximumCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },

    remarks: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
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

schema.index({ store: 1, shelfCode: 1 }, { unique: true });
schema.index({ store: 1, warehouse: 1 });
schema.index({ store: 1, status: 1 });

module.exports = mongoose.model("Shelf", schema);