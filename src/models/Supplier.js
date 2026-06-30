const mongoose = require("mongoose");
const addr = new mongoose.Schema(
  {
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    district: String,
    state: { type: String, required: true },
    country: { type: String, default: "India" },
    pincode: { type: String, required: true },
  },
  { _id: false },
);
const bank = new mongoose.Schema(
  {
    bankName: String,
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String,
    upiId: String,
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    supplierName: { type: String, required: true },
    companyName: { type: String, required: true },
    contactPerson: String,
    mobile: { type: String, required: true, unique: true },
    alternateMobile: String,
    email: { type: String, lowercase: true },
    website: String,
    gstNumber: { type: String, uppercase: true },
    panNumber: { type: String, uppercase: true },
    billingAddress: addr,
    shippingAddress: addr,
    bankDetails: bank,
    creditLimit: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    paymentTerms: { type: String, default: "30 Days" },
    supplierRating: { type: Number, min: 1, max: 5, default: 5 },
    remarks: String,
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Supplier", schema);
