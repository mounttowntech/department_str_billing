const mongoose = require("mongoose");
const StockAdjustment = require("../models/StockAdjustment");
const ProductVariant = require("../models/ProductVariant");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");
const { moveStock } = require("../services/inventoryService");

exports.createStockAdjustment = asyncHandler(async (req, res) => {
  const adjustmentNo = (
    req.body.adjustmentNo || `ADJ-${Date.now()}`
  ).toUpperCase();

  // Find variant by ID and Store
  const variant = await ProductVariant.findOne({
    _id: req.body.variant,
    store: req.body.store,
  });

  if (!variant) {
    return res.status(404).json({
      success: false,
      message: "Variant not found for the selected store",
    });
  }

  const operation =
    req.body.adjustmentType === "increase"
      ? "adjustment_in"
      : "adjustment_out";

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const moved = await moveStock(
      {
        variantId: variant._id,
        batchId: req.body.batch,
        quantity: req.body.quantity,
        operation,
        referenceModel: "StockAdjustment",
        referenceNumber: adjustmentNo,
        store: req.body.store,
        warehouse: req.body.warehouse,
        createdBy: req.user?._id,
        remarks: req.body.reason,
      },
      { session }
    );

    const [doc] = await StockAdjustment.create(
      [
        {
          adjustmentNo,
          store: req.body.store,
          warehouse: req.body.warehouse,
          batch: req.body.batch,
          product: variant.product,
          variant: variant._id,
          skuCode: variant.skuCode,
          adjustmentType: req.body.adjustmentType,
          quantity: req.body.quantity,
          beforeStock: moved.beforeStock,
          afterStock: moved.afterStock,
          reason: req.body.reason,
          createdBy: req.user?._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    success(res, "Stock adjustment created successfully", doc, 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

exports.getAllStockAdjustment = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.store) filter.store = req.query.store;
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.variant) filter.variant = req.query.variant;
  if (req.query.adjustmentType) filter.adjustmentType = req.query.adjustmentType;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const data = await StockAdjustment.find(filter)
    .populate("store", "name")
    .populate("warehouse", "name")
    .populate("product", "name")
    .populate("variant", "skuCode")
    .sort({ createdAt: -1 });

  success(res, "StockAdjustment list", data);
});

exports.getStockAdjustmentById = asyncHandler(async (req, res) => {
  const data = await StockAdjustment.findById(req.params.id)
    .populate("store", "name")
    .populate("warehouse", "name")
    .populate("product", "name")
    .populate("variant", "skuCode");
  if (!data)
    return res.status(404).json({ success: false, message: "StockAdjustment not found" });
  success(res, "StockAdjustment details", data);
});

// Adjustments are ledger entries — only non-stock-affecting fields (reason) are editable
exports.updateStockAdjustment = asyncHandler(async (req, res) => {
  const existing = await StockAdjustment.findById(req.params.id);
  if (!existing)
    return res.status(404).json({ success: false, message: "StockAdjustment not found" });

  if (existing.status === "reversed") {
    return res.status(400).json({ success: false, message: "Cannot edit a reversed adjustment" });
  }

  const { reason } = req.body; // deliberately ignore quantity/adjustmentType/store/etc.
  const data = await StockAdjustment.findByIdAndUpdate(
    req.params.id,
    { reason },
    { new: true, runValidators: true }
  );
  success(res, "StockAdjustment updated", data);
});

// "Delete" now means reverse the stock movement, keeping an audit trail
exports.deleteStockAdjustment = asyncHandler(async (req, res) => {
  const existing = await StockAdjustment.findById(req.params.id);
  if (!existing)
    return res.status(404).json({ success: false, message: "StockAdjustment not found" });

  if (existing.status === "reversed") {
    return res.status(400).json({ success: false, message: "Adjustment already reversed" });
  }

  const reverseOperation =
    existing.adjustmentType === "increase" ? "adjustment_out" : "adjustment_in";

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await moveStock(
      {
        variantId: existing.variant,
        batchId: existing.batch,
        quantity: existing.quantity,
        operation: reverseOperation,
        referenceModel: "StockAdjustment",
        referenceNumber: existing.adjustmentNo + "-REV",
        store: existing.store,
        warehouse: existing.warehouse,
        createdBy: req.user?._id,
        remarks: "Reversal of " + existing.adjustmentNo,
      },
      { session }
    );

    existing.status = "reversed";
    existing.reversedBy = req.user?._id;
    existing.reversedAt = new Date();
    await existing.save({ session });

    await session.commitTransaction();
    session.endSession();
    success(res, "StockAdjustment reversed", existing);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});