const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    shelf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelf",
    },

    batchNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    barcode: {
      type: String,
      required: true,
      trim: true,
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
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    mrp: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    damagedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Available",
        "Sold Out",
        "Expired",
        "Damaged",
        "Returned",
      ],
      default: "Available",
    },

    remarks: {
      type: String,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
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

/* ---------- Virtual ---------- */

schema.virtual("isExpired").get(function () {
  return this.expiryDate && this.expiryDate < new Date();
});

schema.virtual("isAvailable").get(function () {
  return this.remainingQuantity > 0;
});

/* ---------- Pre Save ---------- */

schema.pre("save", function () {
  if (this.remainingQuantity < 0) {
    this.remainingQuantity = 0;
  }

  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = "Expired";
  } else if (this.remainingQuantity === 0) {
    this.status = "Sold Out";
  } else {
    this.status = "Available";
  }
});

/* ---------- Indexes ---------- */

schema.index(
  {
    store: 1,
    batchNumber: 1,
  },
  {
    unique: true,
  }
);

schema.index({
  store: 1,
  barcode: 1,
});

schema.index({
  product: 1,
});

schema.index({
  variant: 1,
});

schema.index({
  supplier: 1,
});

schema.index({
  warehouse: 1,
});

schema.index({
  expiryDate: 1,
});

schema.set("toJSON", { virtuals: true });
schema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Batch", schema);