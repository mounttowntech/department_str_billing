const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      trim: true,
      default: "",
    },

    accountHolderName: {
      type: String,
      trim: true,
      default: "",
    },

    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },

    ifscCode: {
      type: String,
      trim: true,
      default: "",
    },

    branchName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const upiSchema = new mongoose.Schema(
  {
    upiId: {
      type: String,
      trim: true,
      default: "",
    },

    qrCodeImage: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    storeCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    alternatePhone: {
      type: String,
      default: "",
    },

    gstNumber: {
      type: String,
      default: "",
      uppercase: true,
    },

    panNumber: {
      type: String,
      default: "",
      uppercase: true,
    },

    fssaiNumber: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      required: true,
    },

    landmark: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      default: "India",
    },

    pincode: {
      type: String,
      required: true,
    },

    latitude: Number,

    longitude: Number,

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    openingTime: {
      type: String,
      default: "09:00 AM",
    },

    closingTime: {
      type: String,
      default: "09:00 PM",
    },

    currency: {
      type: String,
      default: "INR",
    },

    currencySymbol: {
      type: String,
      default: "₹",
    },

    invoicePrefix: {
      type: String,
      default: "INV",
    },

    purchasePrefix: {
      type: String,
      default: "PUR",
    },

    barcodePrefix: {
      type: String,
      default: "BAR",
    },

    taxType: {
      type: String,
      enum: ["GST", "VAT"],
      default: "GST",
    },

    qrCode: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    bankDetails: bankSchema,

    upiDetails: upiSchema,

    printerName: {
      type: String,
      default: "",
    },

    thermalPrinterWidth: {
      type: Number,
      default: 80,
    },

    receiptFooter: {
      type: String,
      default: "Thank You! Visit Again.",
    },

    isHeadOffice: {
      type: Boolean,
      default: false,
    },

    allowNegativeStock: {
      type: Boolean,
      default: false,
    },

    enableBarcode: {
      type: Boolean,
      default: true,
    },

    enableLoyalty: {
      type: Boolean,
      default: true,
    },

    enableCoupon: {
      type: Boolean,
      default: true,
    },

    enableWhatsAppInvoice: {
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
    timestamps: true
  }
);

module.exports = mongoose.model("Store", storeSchema);