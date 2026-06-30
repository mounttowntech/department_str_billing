const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    couponCode: { type: String, unique: true, required: true, uppercase: true },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minBillAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Coupon", schema);
