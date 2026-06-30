const mongoose = require("mongoose");
const conv = new mongoose.Schema(
  {
    fromUnit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    toUnit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    conversionFactor: { type: Number, required: true, min: 0.0001 },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    unitCode: { type: String, required: true, unique: true, uppercase: true },
    unitName: { type: String, required: true, unique: true },
    shortName: { type: String, required: true, uppercase: true },
    description: String,
    parentUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
    },
    isBaseUnit: { type: Boolean, default: false },
    allowDecimal: { type: Boolean, default: false },
    conversionFactor: { type: Number, default: 1, min: 0.0001 },
    conversions: [conv],
    applicableFor: [String],
    displayOrder: { type: Number, default: 0 },
    remarks: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Unit", schema);
