const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesInvoice",
    },

    invoiceNo: String,

    points: {
      type: Number,
      required: true,
      min: 0,
    },

    type: {
      type: String,
      enum: ["earn", "redeem", "adjust"],
      required: true,
    },

    balanceAfterTransaction: {
      type: Number,
      default: 0,
    },

    remarks: String,

    status: {
      type: Boolean,
      default: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    expiryDate: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("LoyaltyPoints", schema);