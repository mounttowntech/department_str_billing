const mongoose = require("mongoose");
const StockAdjustment = require("../models/StockAdjustment");
const ProductVariant = require("../models/ProductVariant");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");
const { moveStock } = require("../services/inventoryService");

/* ============================================================
   CREATE STOCK ADJUSTMENT
============================================================ */
exports.createStockAdjustment = asyncHandler(async (req, res) => {
  const {
    store,
    warehouse,
    batch,
    variant,
    adjustmentType,
    quantity,
    reason,
    skuCode,
    adjustmentNo,
  } = req.body;

  const userId = req.user?._id || req.user?.id || req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found",
    });
  }

  if (!store) {
    return res.status(400).json({ success: false, message: "Store is required" });
  }

  if (!variant) {
    return res.status(400).json({ success: false, message: "Variant is required" });
  }

  if (!["increase", "decrease"].includes(adjustmentType)) {
    return res.status(400).json({
      success: false,
      message: "Adjustment type must be increase or decrease",
    });
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be greater than 0",
    });
  }

  const variantData = await ProductVariant.findOne({
    _id: variant,
    store,
  });

  if (!variantData) {
    return res.status(404).json({
      success: false,
      message: "Variant not found for the selected store",
    });
  }

  const finalAdjustmentNo = (
    adjustmentNo || `ADJ-${Date.now()}`
  ).toUpperCase();

  const operation =
    adjustmentType === "increase" ? "adjustment_in" : "adjustment_out";

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const moved = await moveStock({
      variantId: variantData._id,
      batchId: batch || null,
      quantity: qty,
      operation,
      referenceModel: "StockAdjustment",
      referenceNumber: finalAdjustmentNo,
      store,
      warehouse: warehouse || null,
      createdBy: userId,
      remarks: reason || null,
      session,
    });

    const [doc] = await StockAdjustment.create(
      [
        {
          adjustmentNo: finalAdjustmentNo,
          store,
          warehouse: warehouse || null,
          batch: batch || null,
          product: variantData.product,
          variant: variantData._id,
          skuCode: skuCode || variantData.skuCode || "",
          adjustmentType,
          quantity: qty,
          beforeStock: moved.beforeStock,
          afterStock: moved.afterStock,
          reason: reason || "",
          createdBy: userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedDoc = await StockAdjustment.findById(doc._id)
      .populate("store", "storeName name")
      .populate("warehouse", "warehouseName name")
      .populate("product", "productName name")
      .populate("variant", "skuCode name packSize");

    return success(
      res,
      "Stock adjustment created successfully",
      populatedDoc,
      201
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Create Stock Adjustment Error:", error);
    throw error;
  }
});

/* ============================================================
   GET ALL STOCK ADJUSTMENTS
============================================================ */
exports.getAllStockAdjustment = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.store) filter.store = req.query.store;
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.variant) filter.variant = req.query.variant;
  if (req.query.adjustmentType) filter.adjustmentType = req.query.adjustmentType;

  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  const data = await StockAdjustment.find(filter)
    .populate("store", "storeName name")
    .populate("warehouse", "warehouseName name")
    .populate("product", "productName name")
    .populate("variant", "skuCode name packSize")
    .sort({ createdAt: -1 });

  return success(res, "Stock Adjustment list", data);
});

/* ============================================================
   GET STOCK ADJUSTMENT BY ID
============================================================ */
exports.getStockAdjustmentById = asyncHandler(async (req, res) => {
  const data = await StockAdjustment.findById(req.params.id)
    .populate("store", "storeName name")
    .populate("warehouse", "warehouseName name")
    .populate("product", "productName name")
    .populate("variant", "skuCode name packSize");

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "StockAdjustment not found",
    });
  }

  return success(res, "StockAdjustment details", data);
});

/* ============================================================
   UPDATE STOCK ADJUSTMENT (ALL FIELDS EDITABLE WITH RE-SYNC)
============================================================ */
exports.updateStockAdjustment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    store,
    warehouse,
    product,
    variant,
    skuCode,
    adjustmentType,
    quantity,
    reason,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Stock Adjustment ID",
    });
  }

  const userId = req.user?._id || req.user?.id || req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await StockAdjustment.findById(id).session(session);
    if (!existing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Stock Adjustment not found",
      });
    }

    const newStore = store || existing.store;
    const newVariant = variant || existing.variant;
    const newType = adjustmentType || existing.adjustmentType;
    const newQty = quantity !== undefined ? Number(quantity) : existing.quantity;

    const variantData = await ProductVariant.findOne({
      _id: newVariant,
      store: newStore,
    }).session(session);

    if (!variantData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Variant not found for the selected store",
      });
    }

    // 1. Reverse old stock adjustment
    const reverseOperation =
      existing.adjustmentType === "increase"
        ? "adjustment_out"
        : "adjustment_in";

    await moveStock({
      variantId: existing.variant,
      batchId: existing.batch || null,
      quantity: Number(existing.quantity),
      operation: reverseOperation,
      referenceModel: "StockAdjustment",
      referenceNumber: `${existing.adjustmentNo}-EDIT-REVERSE`,
      store: existing.store,
      warehouse: existing.warehouse || null,
      createdBy: userId,
      remarks: `Reversal before update for ${existing.adjustmentNo}`,
      session,
    });

    // 2. Apply new stock adjustment
    const applyOperation =
      newType === "increase" ? "adjustment_in" : "adjustment_out";

    const moved = await moveStock({
      variantId: variantData._id,
      batchId: existing.batch || null,
      quantity: newQty,
      operation: applyOperation,
      referenceModel: "StockAdjustment",
      referenceNumber: `${existing.adjustmentNo}-UPDATED`,
      store: newStore,
      warehouse: warehouse || existing.warehouse || null,
      createdBy: userId,
      remarks: reason || existing.reason || null,
      session,
    });

    // 3. Update document fields
    existing.store = newStore;
    existing.warehouse = warehouse !== undefined ? warehouse : existing.warehouse;
    existing.product = product || variantData.product;
    existing.variant = variantData._id;
    existing.skuCode = skuCode || variantData.skuCode || existing.skuCode;
    existing.adjustmentType = newType;
    existing.quantity = newQty;
    existing.beforeStock = moved.beforeStock;
    existing.afterStock = moved.afterStock;
    existing.reason = reason !== undefined ? reason : existing.reason;
    existing.updatedBy = userId;

    await existing.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await StockAdjustment.findById(existing._id)
      .populate("store", "storeName name")
      .populate("warehouse", "warehouseName name")
      .populate("product", "productName name")
      .populate("variant", "skuCode name packSize");

    return success(res, "Stock Adjustment updated successfully", populated);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Update Stock Adjustment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update stock adjustment",
    });
  }
});

/* ============================================================
   DELETE STOCK ADJUSTMENT (WITH INVENTORY REVERSAL)
============================================================ */
exports.deleteStockAdjustment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Stock Adjustment ID",
    });
  }

  const userId = req.user?._id || req.user?.id || req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await StockAdjustment.findById(id).session(session);
    if (!existing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Stock Adjustment not found",
      });
    }

    const quantity = Number(existing.quantity);
    const reverseOperation =
      existing.adjustmentType === "increase"
        ? "adjustment_out"
        : "adjustment_in";

    await moveStock({
      variantId: existing.variant,
      batchId: existing.batch || null,
      quantity,
      operation: reverseOperation,
      referenceId: existing._id,
      referenceModel: "StockAdjustment",
      referenceNumber: `${existing.adjustmentNo}-DELETE`,
      store: existing.store,
      warehouse: existing.warehouse || null,
      createdBy: userId,
      remarks: `Stock reversed because ${existing.adjustmentNo} was deleted`,
      session,
    });

    await StockAdjustment.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Stock Adjustment deleted permanently and stock reversed",
      data: {
        id: existing._id,
        adjustmentNo: existing.adjustmentNo,
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Delete Stock Adjustment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete Stock Adjustment",
    });
  }
});