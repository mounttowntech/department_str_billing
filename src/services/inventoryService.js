const ProductVariant = require("../models/ProductVariant");
const Batch = require("../models/Batch");
const Product = require("../models/Product");

const stockCalculation = require("../utils/stockCalculation");
const createStockLedger = require("../utils/createStockLedger");

// ============================================================
// MOVE STOCK
// ============================================================

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
  session = null,
}) => {
  // ==========================================================
  // VALIDATE VARIANT ID
  // ==========================================================

  if (!variantId) {
    throw new Error("Product variant ID is required");
  }

  // ==========================================================
  // VALIDATE QUANTITY
  // ==========================================================

  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Invalid stock quantity");
  }

  // ==========================================================
  // FIND PRODUCT VARIANT
  // ==========================================================

  let variantQuery = ProductVariant.findById(variantId).populate(
    "product"
  );

  if (session) {
    variantQuery = variantQuery.session(session);
  }

  const variant = await variantQuery;

  // ==========================================================
  // VARIANT NOT FOUND
  // ==========================================================

  if (!variant) {
    throw new Error(
      `Product variant not found: ${variantId}`
    );
  }

  // ==========================================================
  // PRODUCT NOT FOUND
  // ==========================================================

  if (!variant.product) {
    throw new Error(
      `Product not found for variant: ${variant._id}`
    );
  }

  // ==========================================================
  // PRODUCT ID
  // ==========================================================

  const productId = variant.product._id;

  // ==========================================================
  // CALCULATE VARIANT STOCK
  // ==========================================================

  const {
    beforeStock,
    afterStock,
  } = stockCalculation(
    Number(variant.currentStock || 0),
    qty,
    operation,
    allowNegative
  );

  // ==========================================================
  // UPDATE VARIANT STOCK
  // ==========================================================

  variant.currentStock = afterStock;

  if (warehouse) {
    variant.warehouse = warehouse;
  }

  await variant.save({
    session,
  });

  // ==========================================================
  // UPDATE BATCH STOCK
  // ==========================================================

  if (batchId) {
    let batchQuery = Batch.findById(batchId);

    if (session) {
      batchQuery = batchQuery.session(session);
    }

    const batch = await batchQuery;

    // --------------------------------------------------------
    // BATCH NOT FOUND
    // --------------------------------------------------------

    if (!batch) {
      throw new Error(
        `Batch not found: ${batchId}`
      );
    }

    // --------------------------------------------------------
    // CALCULATE BATCH STOCK
    // --------------------------------------------------------

    const batchStock = stockCalculation(
      Number(batch.remainingQuantity || 0),
      qty,
      operation,
      allowNegative
    );

    batch.remainingQuantity =
      batchStock.afterStock;

    await batch.save({
      session,
    });
  }

  // ==========================================================
  // RECALCULATE TOTAL PRODUCT STOCK
  // ==========================================================

  let variantsQuery = ProductVariant.find({
    product: productId,
  });

  if (session) {
    variantsQuery = variantsQuery.session(session);
  }

  const variants = await variantsQuery;

  const totalStock = variants.reduce(
    (sum, item) =>
      sum + Number(item.currentStock || 0),
    0
  );

  // ==========================================================
  // UPDATE PRODUCT TOTAL STOCK
  // ==========================================================

  const productUpdate = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        totalStock,
      },
    },
    {
      new: true,
      session,
    }
  );

  if (!productUpdate) {
    throw new Error(
      `Product not found: ${productId}`
    );
  }

  // ==========================================================
  // CREATE STOCK LEDGER
  // ==========================================================

  await createStockLedger({
    store,
    warehouse,
    batch: batchId,
    product: productId,
    variant: variant._id,
    skuCode: variant.skuCode,
    barcode: variant.barcode,
    movementType: operation,
    quantity: qty,
    beforeStock,
    afterStock,
    referenceId,
    referenceModel,
    referenceNumber,
    createdBy,
    remarks,
    session,
  });

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    variant,
    productId,
    beforeStock,
    afterStock,
  };
};