const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // Store
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      unique: true,
      index: true,
    },

    // Inventory Settings
    lowStockAlert: {
      type: Boolean,
      default: true,
    },

    lowStockQuantity: {
      type: Number,
      default: 5,
      min: 0,
    },

    allowNegativeStock: {
      type: Boolean,
      default: false,
    },

    expiryAlertDays: {
      type: Number,
      default: 30,
      min: 0,
    },

    // Invoice Settings
    invoicePrefix: {
      type: String,
      default: "INV",
      trim: true,
      uppercase: true,
    },

    purchasePrefix: {
      type: String,
      default: "PUR",
      trim: true,
      uppercase: true,
    },

    invoicePrintSize: {
      type: String,
      enum: ["A4", "Thermal80", "Thermal58"],
      default: "Thermal80",
    },

    roundOff: {
      type: Boolean,
      default: true,
    },

    // GST
    gstInclusive: {
      type: Boolean,
      default: false,
    },

    // Payment
    defaultPaymentMode: {
      type: String,
      enum: [
        "Cash",
        "Card",
        "UPI",
        "Bank Transfer",
        "Wallet",
        "Cheque",
      ],
      default: "Cash",
    },

    // Loyalty Settings
    loyaltyEnabled: {
      type: Boolean,
      default: true,
    },

    loyaltyEarnPerAmount: {
      type: Number,
      default: 100,
    },

    loyaltyPointsPerAmount: {
      type: Number,
      default: 1,
    },

    redeemPointValue: {
      type: Number,
      default: 1,
    },

    // Currency
    currency: {
      type: String,
      default: "INR",
    },

    currencySymbol: {
      type: String,
      default: "₹",
    },

    // Barcode
    barcodeType: {
      type: String,
      enum: ["CODE128", "EAN13", "QR"],
      default: "CODE128",
    },

    // Status
    status: {
      type: Boolean,
      default: true,
    },

    // Audit
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

module.exports = mongoose.model("Settings", schema);