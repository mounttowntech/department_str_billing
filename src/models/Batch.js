const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    barcode: { type: String, unique: true, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    shelf: { type: mongoose.Schema.Types.ObjectId, ref: "Shelf" },
    manufacturingDate: Date,
    expiryDate: Date,
    receivedDate: { type: Date, default: Date.now },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    mrp: { type: Number, required: true },
    quantity: { type: Number, required: true },
    remainingQuantity: { type: Number, required: true },
    damagedQuantity: { type: Number, default: 0 },
    returnedQuantity: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Available", "Sold Out", "Expired", "Damaged"],
      default: "Available",
    },
    remarks: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
schema.pre("save", function (next) {
  if (this.remainingQuantity < 0) this.remainingQuantity = 0;
  if (this.remainingQuantity === 0) this.status = "Sold Out";
  if (this.expiryDate && this.expiryDate < new Date()) this.status = "Expired";
  next();
});
module.exports = mongoose.model("Batch", schema);
