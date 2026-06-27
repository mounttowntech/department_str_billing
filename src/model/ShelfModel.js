const mongoose = require("mongoose");

const shelfSchema = new mongoose.Schema(
  {
    shelfCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    shelfName: {
      type: String,
      required: true,
      trim: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    rackNumber: {
      type: String,
      required: true,
    },

    floorNumber: {
      type: Number,
      default: 1,
    },

    section: {
      type: String,
      default: "",
    },

    storageType: {
      type: String,
      enum: [
        "Normal",
        "Cold",
        "Frozen",
        "Dry Storage"
      ],
      default: "Normal",
    },

    maximumCapacity: {
      type: Number,
      default: 0,
    },

    currentCapacity: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "maintenance"
      ],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

shelfSchema.index({
    shelfCode:1
});

shelfSchema.index({
    warehouse:1
});

shelfSchema.index({
    rackNumber:1
});

module.exports = mongoose.model(
    "Shelf",
    shelfSchema
);