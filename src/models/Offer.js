const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      required: true,
      trim: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

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

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
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

schema.index({ store: 1 });
schema.index({ product: 1 });
schema.index({ category: 1 });
schema.index({ status: 1 });

module.exports = mongoose.model("Offer", schema);