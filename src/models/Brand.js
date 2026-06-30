const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    brandCode: { type: String, required: true, unique: true, uppercase: true },
    brandName: { type: String, required: true, unique: true },
    displayName: String,
    companyName: String,
    logo: String,
    website: String,
    email: { type: String, lowercase: true },
    phone: String,
    address: String,
    country: { type: String, default: "India" },
    description: String,
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Brand", schema);
