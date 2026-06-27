const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    brandCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    brandName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
    },

    companyName: {
      type: String,
      default: "",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "India",
    },

    description: {
      type: String,
      default: "",
    },

    isFeatured: {
      type: Boolean,
      default: false,
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

brandSchema.index({ brandCode: 1 });
brandSchema.index({ brandName: 1 });

module.exports = mongoose.model("Brand", brandSchema);