const mongoose = require("mongoose");

const transferItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    skuCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const stockTransferSchema = new mongoose.Schema(
  {
    transferNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    items: {
      type: [transferItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "At least one transfer item is required.",
      },
    },

    totalItems: {
      type: Number,
      default: 0,
    },

    totalQuantity: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "cancelled",
      ],
      default: "completed",
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* -----------------------------
   Calculate Totals
------------------------------*/

stockTransferSchema.pre("save", function () {
  this.totalItems = this.items.length;

  this.totalQuantity = this.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );


});

/* -----------------------------
   Indexes
------------------------------*/

stockTransferSchema.index({ transferNo: 1 });

stockTransferSchema.index({ store: 1, createdAt: -1 });

stockTransferSchema.index({ status: 1 });

stockTransferSchema.index({ fromWarehouse: 1 });

stockTransferSchema.index({ toWarehouse: 1 });

stockTransferSchema.index({
  store: 1,
  transferNo: 1,
});

module.exports = mongoose.model(
  "StockTransfer",
  stockTransferSchema
);