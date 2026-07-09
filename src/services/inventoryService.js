const ProductVariant = require("../models/ProductVariant");
const Batch = require("../models/Batch");
const Product = require("../models/Product");
const stockCalculation = require("../utils/stockCalculation");
const createStockLedger = require("../utils/createStockLedger");

exports.moveStock = async ({
  variantId,
  batchId,
  quantity,
  operation,
  referenceId,
  referenceModel,
  referenceNumber,
  store,
  warehouse,
  createdBy,
  remarks,
  allowNegative = false,
}) => {
  // Get Product Variant
  const variant = await ProductVariant.findById(variantId).populate("product");

  if (!variant) {
    throw new Error("Product variant not found");
  }

  // Calculate Variant Stock
  const { beforeStock, afterStock } = stockCalculation(
    variant.currentStock,
    quantity,
    operation,
    allowNegative
  );

  variant.currentStock = afterStock;

  if (warehouse) {
    variant.warehouse = warehouse;
  }

  await variant.save();

  // Update Batch Stock
  if (batchId) {
    const batch = await Batch.findById(batchId);

    if (batch) {
      const batchStock = stockCalculation(
        batch.remainingQuantity,
        quantity,
        operation,
        allowNegative
      );

      batch.remainingQuantity = batchStock.afterStock;

      await batch.save();
    }
  }

  // Recalculate Total Product Stock
  const variants = await ProductVariant.find({
    product: variant.product._id,
  });

  const totalStock = variants.reduce(
    (sum, item) => sum + Number(item.currentStock || 0),
    0
  );

  // Update Product Total Stock
  await Product.findByIdAndUpdate(
    variant.product._id,
    {
      $set: {
        totalStock,
      },
    },
    {
      new: true,
    }
  );

  // Create Stock Ledger Entry
  await createStockLedger({
    store,
    warehouse,
    batch: batchId,
    product: variant.product._id,
    variant: variant._id,
    skuCode: variant.skuCode,
    barcode: variant.barcode,
    movementType: operation,
    quantity,
    beforeStock,
    afterStock,
    referenceId,
    referenceModel,
    referenceNumber,
    createdBy,
    remarks,
  });

  return {
    variant,
    beforeStock,
    afterStock,
  };
};