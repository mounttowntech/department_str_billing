const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    label: {
      type: String,
      enum: ["home", "office", "billing", "shipping"],
      default: "home",
    },
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("CustomerAddress", schema);
