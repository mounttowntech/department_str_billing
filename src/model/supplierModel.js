const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
    },

    pincode: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const bankSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      default: "",
    },

    accountHolderName: {
      type: String,
      default: "",
    },

    accountNumber: {
      type: String,
      default: "",
    },

    ifscCode: {
      type: String,
      default: "",
    },

    branchName: {
      type: String,
      default: "",
    },

    upiId: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      unique: true,
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
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      default: "",
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
    },

    alternateMobile: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    website: {
      type: String,
      default: "",
    },

    gstNumber: {
      type: String,
      uppercase: true,
      default: "",
    },

    panNumber: {
      type: String,
      uppercase: true,
      default: "",
    },

    billingAddress: addressSchema,

    shippingAddress: addressSchema,

    bankDetails: bankSchema,

    creditLimit: {
      type: Number,
      default: 0,
    },

    outstandingBalance: {
      type: Number,
      default: 0,
    },

    paymentTerms: {
      type: String,
      enum: [
        "Cash",
        "7 Days",
        "15 Days",
        "30 Days",
        "45 Days",
        "60 Days",
        "90 Days"
      ],
      default: "30 Days",
    },

    supplierRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },

    purchaseHistory: [
      {
        purchase: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Purchase",
        },

        amount: Number,

        purchaseDate: Date,
      }
    ],

    remarks: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "blocked"
      ],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

supplierSchema.index({
  supplierCode: 1,
});

supplierSchema.index({
  supplierName: 1,
});

supplierSchema.index({
  companyName: 1,
});

supplierSchema.index({
  mobile: 1,
});

module.exports = mongoose.model(
  "Supplier",
  supplierSchema
);