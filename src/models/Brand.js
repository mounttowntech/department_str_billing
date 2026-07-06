const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    brandCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    brandName: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    logo: String,

    website: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    industryType: {
      type: String,
      enum: ["department_store", "garments", "restaurant", "general"],
      default: "department_store",
    },

    displayOrder: {
      type: Number,
      default: 1,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    showOnPOS: {
      type: Boolean,
      default: true,
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

schema.index({ store: 1, brandCode: 1 }, { unique: true });
schema.index({ store: 1, brandName: 1 }, { unique: true });
schema.index({ store: 1, industryType: 1 });

module.exports = mongoose.model("Brand", schema);