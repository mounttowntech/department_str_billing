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
  const variant = await ProductVariant.findById(variantId).populate("product");
  if (!variant) throw new Error("Product variant not found");
  const { beforeStock, afterStock } = stockCalculation(
    variant.currentStock,
    quantity,
    operation,
    allowNegative,
  );
  variant.currentStock = afterStock;
  if (warehouse) variant.warehouse = warehouse;
  await variant.save();
  if (batchId) {
    const batch = await Batch.findById(batchId);
    if (batch) {
      const b = stockCalculation(
        batch.remainingQuantity,
        quantity,
        operation,
        allowNegative,
      );
      batch.remainingQuantity = b.afterStock;
      await batch.save();
    }
  }
  await Product.findByIdAndUpdate(variant.product._id, [
    { $set: { totalStock: { $sum: "$variants.currentStock" } } },
  ]).catch(() => {});
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
  return { variant, beforeStock, afterStock };
};
