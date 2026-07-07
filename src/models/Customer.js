const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    customerCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    city: String,
    state: String,
    country: {
      type: String,
      default: "India",
    },
    pincode: String,

    totalPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    customerType: {
      type: String,
      enum: ["walk_in", "regular", "wholesale"],
      default: "regular",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
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

schema.index({ store: 1, customerCode: 1 }, { unique: true });
schema.index({ store: 1, phone: 1 }, { unique: true });
schema.index({ store: 1, customerName: 1 });

module.exports = mongoose.model("Customer", schema);