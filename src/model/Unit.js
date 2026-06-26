const mongoose = require("mongoose");

const conversionSchema = new mongoose.Schema(
  {
    fromUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },

    toUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },

    conversionFactor: {
      type: Number,
      required: true,
      min: 0.0001,
    },
  },
  {
    _id: false,
  }
);

const unitSchema = new mongoose.Schema(
  {
    unitCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    unitName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    parentUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
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
      min: 0.0001,
    },

    conversions: [conversionSchema],

    applicableFor: [
      {
        type: String,
        enum: [
          "Inventory",
          "Purchase",
          "Sales",
          "Warehouse",
          "Production",
        ],
      },
    ],

    displayOrder: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
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

unitSchema.index({ unitCode: 1 });
unitSchema.index({ unitName: 1 });
unitSchema.index({ shortName: 1 });

module.exports = mongoose.model("Unit", unitSchema);