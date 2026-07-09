const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    unitCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    unitName: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    isBaseUnit: {
      type: Boolean,
      default: false,
    },

    allowDecimal: {
      type: Boolean,
      default: false,
    },

    conversionFactor: {
      type: Number,
      default: 1,
      min: 1,
    },

    applicableFor: [{
      type: String,
      enum: [
        "Product",
        "Purchase",
        "Sales",
        "Inventory"
      ]
    }],

    displayOrder: {
      type: Number,
      default: 1,
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

schema.index({ store: 1, unitCode: 1 }, { unique: true });
schema.index({ store: 1, unitName: 1 }, { unique: true });

module.exports = mongoose.model("Unit", schema);