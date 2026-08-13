const mongoose = require("mongoose");
const StockAdjustment = require("../models/StockAdjustment");
const ProductVariant = require("../models/ProductVariant");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");
const { moveStock } = require("../services/inventoryService");

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
  } = req.body;

  // ==========================================================
  // USER
  // ==========================================================

  const userId =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId;

  console.log("CREATE STOCK ADJUSTMENT USER:", userId);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found",
    });
  }

  // ==========================================================
  // VALIDATE VARIANT
  // ==========================================================

  if (!variant) {
    return res.status(400).json({
      success: false,
      message: "Variant is required",
    });
  }

  // ==========================================================
  // VALIDATE STORE
  // ==========================================================

  if (!store) {
    return res.status(400).json({
      success: false,
      message: "Store is required",
    });
  }

  // ==========================================================
  // VALIDATE ADJUSTMENT TYPE
  // ==========================================================

  if (!["increase", "decrease"].includes(adjustmentType)) {
    return res.status(400).json({
      success: false,
      message:
        "Adjustment type must be increase or decrease",
    });
  }

  // ==========================================================
  // VALIDATE QUANTITY
  // ==========================================================

  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be greater than 0",
    });
  }

  // ==========================================================
  // FIND VARIANT
  // ==========================================================

  const variantData = await ProductVariant.findOne({
    _id: variant,
    store: store,
  });

  if (!variantData) {
    return res.status(404).json({
      success: false,
      message: "Variant not found for the selected store",
    });
  }

  // ==========================================================
  // ADJUSTMENT NUMBER
  // ==========================================================

  const adjustmentNo = (
    req.body.adjustmentNo ||
    `ADJ-${Date.now()}`
  ).toUpperCase();

  // ==========================================================
  // STOCK OPERATION
  // ==========================================================

  const operation =
    adjustmentType === "increase"
      ? "adjustment_in"
      : "adjustment_out";

  // ==========================================================
  // START TRANSACTION
  // ==========================================================

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ========================================================
    // MOVE STOCK
    // ========================================================

    const moved = await moveStock({
      variantId: variantData._id,

      batchId: batch || null,

      quantity: qty,

      operation,

      referenceModel: "StockAdjustment",

      referenceNumber: adjustmentNo,

      store,

      warehouse: warehouse || null,

      createdBy: userId,

      remarks: reason || null,

      session,
    });

    // ========================================================
    // CREATE STOCK ADJUSTMENT
    // ========================================================

    const [doc] = await StockAdjustment.create(
      [
        {
          adjustmentNo,

          store,

          warehouse: warehouse || null,

          batch: batch || null,

          product: variantData.product,

          variant: variantData._id,

          skuCode:
            skuCode ||
            variantData.skuCode,

          adjustmentType,

          quantity: qty,

          beforeStock: moved.beforeStock,

          afterStock: moved.afterStock,

          reason: reason || null,

          status: "active",

          isDeleted: false,

          createdBy: userId,
        },
      ],
      {
        session,
      }
    );

    // ========================================================
    // COMMIT
    // ========================================================

    await session.commitTransaction();

    session.endSession();

    return success(
      res,
      "Stock adjustment created successfully",
      doc,
      201
    );
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error(
      "Create Stock Adjustment Error:",
      err
    );

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



exports.deleteStockAdjustment = asyncHandler(async (req, res) => {const { id } = req.params;


if (!mongoose.Types.ObjectId.isValid(id)) {return res.status(400).json({success: false,message: "Invalid StockAdjustment ID",});}

// ==========================================================// GET USER// ==========================================================

const userId = req.user?._id || req.user?.id;

if (!userId) {return res.status(401).json({success: false,message: "Authenticated user not found",});}

// ==========================================================// START TRANSACTION// ==========================================================

const session = await mongoose.startSession();

try {session.startTransaction();

// ========================================================
// FIND STOCK ADJUSTMENT
// ========================================================

const existing = await StockAdjustment.findOne({
  _id: id,
  isDeleted: false,
}).session(session);

if (!existing) {
  await session.abortTransaction();
  session.endSession();

  return res.status(404).json({
    success: false,
    message: "StockAdjustment not found",
  });
}

// ========================================================
// VALIDATE ADJUSTMENT TYPE
// ========================================================

if (
  existing.adjustmentType !== "increase" &&
  existing.adjustmentType !== "decrease"
) {
  throw new Error(
    `Invalid adjustment type: ${existing.adjustmentType}`
  );
}

// ========================================================
// VALIDATE QUANTITY
// ========================================================

const quantity = Number(existing.quantity);

if (!Number.isFinite(quantity) || quantity <= 0) {
  throw new Error(
    "Invalid stock adjustment quantity"
  );
}

// ========================================================
// VALIDATE VARIANT
// ========================================================

if (!existing.variant) {
  throw new Error(
    `Variant is missing for StockAdjustment ${existing.adjustmentNo}`
  );
}

// ========================================================
// DETERMINE STOCK REVERSAL OPERATION
// ========================================================

/*
  Original increase:
    Stock + quantity

  Delete:
    Stock - quantity

  Original decrease:
    Stock - quantity

  Delete:
    Stock + quantity
*/

const reverseOperation =
  existing.adjustmentType === "increase"
    ? "adjustment_out"
    : "adjustment_in";

// ========================================================
// DELETE REFERENCE
// ========================================================

const deleteReference =
  `${existing.adjustmentNo}-DELETE`;

// ========================================================
// RESTORE / REVERSE STOCK
// ========================================================

await moveStock({
  variantId: existing.variant,

  batchId: existing.batch || null,

  quantity,

  operation: reverseOperation,

  referenceId: existing._id,

  referenceModel: "StockAdjustment",

  referenceNumber: deleteReference,

  store: existing.store || null,

  warehouse: existing.warehouse || null,

  createdBy: userId,

  remarks:
    `Stock restored because ${existing.adjustmentNo} was deleted`,

  session,
});

// ========================================================
// SOFT DELETE STOCK ADJUSTMENT
// ========================================================

existing.isDeleted = true;

existing.deletedAt = new Date();

existing.deletedBy = userId;

existing.updatedBy = userId;

await existing.save({
  session,
});

// ========================================================
// COMMIT TRANSACTION
// ========================================================

await session.commitTransaction();

session.endSession();

// ========================================================
// SUCCESS RESPONSE
// ========================================================

return res.status(200).json({
  success: true,
  message: "StockAdjustment deleted successfully",
  data: {
    adjustmentId: existing._id,
    adjustmentNo: existing.adjustmentNo,
    isDeleted: existing.isDeleted,
    deletedAt: existing.deletedAt,
    deletedBy: existing.deletedBy,
  },
});

} catch (error) {// ========================================================// ROLLBACK// ========================================================

if (session.inTransaction()) {
  await session.abortTransaction();
}

session.endSession();

console.error(
  "Delete StockAdjustment Error:",
  error
);

return res.status(500).json({
  success: false,
  message:
    error.message ||
    "Failed to delete StockAdjustment",
});

}});