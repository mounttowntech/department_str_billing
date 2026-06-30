const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    offerName: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentCategory",
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentSubCategory",
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    startDate: Date,
    endDate: Date,
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Offer", schema);
