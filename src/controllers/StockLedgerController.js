const mongoose = require("mongoose");
const StockLedger = require("../models/StockLedger");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/responseHandler");

const success = response.success;

/* ============================================================
   CREATE STOCK LEDGER ENTRY
============================================================ */
exports.createStockLedger = asyncHandler(async (req, res) => {
  const {
    store,
    warehouse,
    batch,
    product,
    variant,
    skuCode,
    barcode,
    movementType,
    quantity,
    beforeStock,
    afterStock,
    referenceId,
    referenceModel,
    referenceNumber,
    remarks,
    createdBy,
  } = req.body;

  const userId =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    createdBy;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found. Please log in again.",
    });
  }

  if (!store) {
    return res.status(400).json({
      success: false,
      message: "Store is required",
    });
  }

  if (!product) {
    return res.status(400).json({
      success: false,
      message: "Product is required",
    });
  }

  if (!variant) {
    return res.status(400).json({
      success: false,
      message: "Variant is required",
    });
  }

  if (!movementType) {
    return res.status(400).json({
      success: false,
      message: "Movement Type is required",
    });
  }

  if (!quantity || Number(quantity) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be greater than 0",
    });
  }

  const ledger = await StockLedger.create({
    store,
    warehouse: warehouse || null,
    batch: batch || null,
    product,
    variant,
    skuCode: String(skuCode || "").trim().toUpperCase(),
    barcode: barcode || "",
    movementType,
    quantity: Number(quantity),
    beforeStock: Number(beforeStock || 0),
    afterStock: Number(afterStock || 0),
    referenceId: referenceId || null,
    referenceModel: referenceModel || "OpeningStock",
    referenceNumber: referenceNumber?.trim() || "",
    remarks: remarks?.trim() || "",
    createdBy: userId,
  });

  const data = await StockLedger.findById(ledger._id)
    .populate("store", "storeName name")
    .populate("warehouse", "warehouseName name")
    .populate("batch", "batchNo")
    .populate("product", "productName name")
    .populate("variant", "variantName skuCode name")
    .populate("createdBy", "name email");

  return success(res, "Stock Ledger created successfully.", data, 201);
});

/* ============================================================
   GET ALL STOCK LEDGER ENTRIES
============================================================ */
exports.getStockLedger = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
    search,
    store,
    warehouse,
    product,
    variant,
    movementType,
    fromDate,
    toDate,
  } = req.query;

  const filter = {
    isDeleted: { $ne: true },
  };

  if (store) filter.store = store;
  if (warehouse) filter.warehouse = warehouse;
  if (product) filter.product = product;
  if (variant) filter.variant = variant;
  if (movementType) filter.movementType = movementType;

  if (fromDate || toDate) {
    filter.createdAt = {};

    if (fromDate) {
      filter.createdAt.$gte = new Date(fromDate);
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  if (search) {
    filter.$or = [
      { skuCode: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
      { referenceNumber: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await StockLedger.countDocuments(filter);

  const data = await StockLedger.find(filter)
    .populate("store", "storeName name")
    .populate("warehouse", "warehouseName name")
    .populate("batch", "batchNo")
    .populate("product", "productName name")
    .populate("variant", "variantName skuCode name")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return success(res, "Stock ledger list fetched successfully.", {
    total,
    currentPage: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
    count: data.length,
    data,
  });
});

/* ============================================================
   GET STOCK LEDGER BY ID
============================================================ */
exports.getStockLedgerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Stock Ledger ID",
    });
  }

  const data = await StockLedger.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate("store", "storeName name")
    .populate("warehouse", "warehouseName name")
    .populate("batch", "batchNo")
    .populate("product", "productName name")
    .populate("variant", "variantName skuCode name")
    .populate("createdBy", "name email");

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Stock ledger not found.",
    });
  }

  return success(res, "Stock ledger details fetched successfully.", data);
});

/* ============================================================
   UPDATE STOCK LEDGER
============================================================ */
exports.updateStockLedgerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Stock Ledger ID",
    });
  }

  const data = await StockLedger.findByIdAndUpdate(
    id,
    {
      ...req.body,
      updatedBy: userId,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("store", "storeName name")
    .populate("warehouse", "warehouseName name")
    .populate("batch", "batchNo")
    .populate("product", "productName name")
    .populate("variant", "variantName skuCode name")
    .populate("createdBy", "name email");

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Stock ledger not found.",
    });
  }

  return success(res, "Stock ledger updated successfully.", data);
});

/* ============================================================
   DELETE STOCK LEDGER (SOFT DELETE)
============================================================ */
exports.deleteStockLedgerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Stock Ledger ID",
    });
  }

  const userId =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId;

  const deleted = await StockLedger.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId || null,
      },
    },
    { new: true }
  );

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Stock ledger not found or already deleted.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Stock ledger deleted successfully.",
    data: {
      ledgerId: deleted._id,
      referenceNumber: deleted.referenceNumber,
    },
  });
});