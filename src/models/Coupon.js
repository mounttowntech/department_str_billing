const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    minBillAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    /*
      0 = Unlimited
      > 0 = Limited usage
    */
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
      Number of times coupon has been successfully used
    */
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    status: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

/* ============================================================
   INDEXES
============================================================ */

couponSchema.index({
  couponCode: 1,
});

couponSchema.index({
  store: 1,
});

couponSchema.index({
  status: 1,
});

couponSchema.index({
  endDate: 1,
});

couponSchema.index({
  store: 1,
  couponCode: 1,
});

module.exports =
  mongoose.model("Coupon", couponSchema);