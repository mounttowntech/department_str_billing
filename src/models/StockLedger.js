const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" },
    skuCode: String,
    barcode: String,
    movementType: {
      type: String,
      enum: [
        "purchase",
        "sale",
        "sales_return",
        "purchase_return",
        "adjustment_in",
        "adjustment_out",
        "transfer_in",
        "transfer_out",
      ],
    },
    quantity: Number,
    beforeStock: Number,
    afterStock: Number,
    referenceId: mongoose.Schema.Types.ObjectId,
    referenceModel: String,
    referenceNumber: String,
    remarks: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("StockLedger", schema);
