const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    supplierCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    companyName: {
      type: String,
      trim: true,
    },

    contactPerson: {
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

    alternatePhone: {
      type: String,
      trim: true,
    },

    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },

    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },

    address: String,
    city: String,
    state: String,

    country: {
      type: String,
      default: "India",
    },

    pincode: String,

    bankName: String,
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,

    paymentTerms: {
      type: Number,
      default: 0,
    },

    creditLimit: {
      type: Number,
      default: 0,
    },

    openingBalance: {
      type: Number,
      default: 0,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    notes: String,

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

schema.index(
  { store: 1, supplierCode: 1 },
  { unique: true }
);

schema.index(
  { store: 1, supplierName: 1 },
  { unique: true }
);

module.exports = mongoose.model("Supplier", schema);