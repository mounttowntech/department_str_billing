const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    barcode: {
      type: String,
      unique: true,
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
    },

    shelf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelf",
    },

    manufacturingDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
    },

    receivedDate: {
      type: Date,
      default: Date.now,
    },

    purchasePrice: {
      type: Number,
      required: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    mrp: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    remainingQuantity: {
      type: Number,
      required: true,
    },

    damagedQuantity: {
      type: Number,
      default: 0,
    },

    returnedQuantity: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Available", "Sold Out", "Expired", "Damaged"],
      default: "Available",
    },

    remarks: String,

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
  },
);

batchSchema.pre("save", function (next) {
  if (this.remainingQuantity < 0) {
    this.remainingQuantity = 0;
  }

  if (this.remainingQuantity === 0) {
    this.status = "Sold Out";
  }

  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = "Expired";
  }

  next();
});

batchSchema.index({
  batchNumber: 1,
});

batchSchema.index({
  barcode: 1,
});

batchSchema.index({
  product: 1,
});

batchSchema.index({
  warehouse: 1,
});

module.exports = mongoose.model("Batch", batchSchema);
