const mongoose = require("mongoose");
const taxSlabSchema = new mongoose.Schema(
  { taxName: String, percentage: Number, isDefault: Boolean },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    taxCode: { type: String, required: true, unique: true, uppercase: true },
    taxName: { type: String, required: true },
    taxType: {
      type: String,
      enum: ["GST", "VAT", "IGST", "CGST_SGST", "CESS", "CUSTOM"],
      default: "GST",
    },
    hsnSacCode: { type: String, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cess: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    taxCalculationType: {
      type: String,
      enum: ["Inclusive", "Exclusive"],
      default: "Exclusive",
    },
    taxSlabs: [taxSlabSchema],
    isDefaultTax: { type: Boolean, default: false },
    applicableFor: [
      { type: String, enum: ["Purchase", "Sales", "Service", "Expense"] },
    ],
    description: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
schema.pre("save", function () {
  this.totalTax =
    Number(this.cgst || 0) +
    Number(this.sgst || 0) +
    Number(this.igst || 0) +
    Number(this.cess || 0) +
    Number(this.vat || 0);
});
module.exports = mongoose.model("TaxSetting", schema);
