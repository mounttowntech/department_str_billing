const mongoose = require("mongoose");

const taxSlabSchema = new mongoose.Schema(
  {
    taxName: {
      type: String,
      required: true,
      trim: true,
    },

    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const taxSettingSchema = new mongoose.Schema(
  {
    taxCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    taxName: {
      type: String,
      required: true,
      trim: true,
    },

    taxType: {
      type: String,
      enum: [
        "GST",
        "VAT",
        "IGST",
        "CGST_SGST",
        "CESS",
        "CUSTOM"
      ],
      required: true,
      default: "GST",
    },

    hsnSacCode: {
      type: String,
      required: true,
      trim: true,
    },

    cgst: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    sgst: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    igst: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    cess: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    vat: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    totalTax: {
      type: Number,
      default: 0,
    },

    taxCalculationType: {
      type: String,
      enum: [
        "Inclusive",
        "Exclusive"
      ],
      default: "Exclusive",
    },

    taxSlabs: [taxSlabSchema],

    isDefaultTax: {
      type: Boolean,
      default: false,
    },

    applicableFor: [
      {
        type: String,
        enum: [
          "Purchase",
          "Sales",
          "Service",
          "Expense"
        ],
      },
    ],

    description: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive"
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
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

taxSettingSchema.pre("save", function (next) {
  this.totalTax =
    Number(this.cgst) +
    Number(this.sgst) +
    Number(this.igst) +
    Number(this.cess) +
    Number(this.vat);

  next();
});

taxSettingSchema.index({
  taxCode: 1,
});

taxSettingSchema.index({
  taxName: 1,
});

taxSettingSchema.index({
  hsnSacCode: 1,
});

module.exports = mongoose.model(
  "TaxSetting",
  taxSettingSchema
);