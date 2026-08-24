const mongoose = require("mongoose");
const StockTransfer = require("../models/StockTransfer");
const ProductVariant = require("../models/ProductVariant");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");
const { moveStock } = require("../services/inventoryService");

/* ============================================================
   CREATE STOCK TRANSFER
============================================================ */
exports.createStockTransfer = asyncHandler(async (req, res) => {
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.createdBy;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found",
    });
  }

  const {
    store,
    fromWarehouse,
    toWarehouse,
    items,
    remarks,
  } = req.body;

  if (!store) {
    return res.status(400).json({ success: false, message: "Store is required." });
  }
  if (!fromWarehouse) {
    return res.status(400).json({ success: false, message: "From Warehouse is required." });
  }
  if (!toWarehouse) {
    return res.status(400).json({ success: false, message: "To Warehouse is required." });
  }
  if (String(fromWarehouse) === String(toWarehouse)) {
    return res.status(400).json({
      success: false,
      message: "From Warehouse and To Warehouse cannot be the same.",
    });
  }
  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: "Transfer items are required." });
  }

  const transferNo = (req.body.transferNo || `STF-${Date.now()}`).toUpperCase();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let totalQuantity = 0;
    const transferItems = [];

    for (const item of items) {
      let variant = null;

      if (item.variant && mongoose.Types.ObjectId.isValid(item.variant)) {
        variant = await ProductVariant.findOne({
          _id: item.variant,
          store,
        }).session(session);
      }

      if (!variant && item.skuCode) {
        variant = await ProductVariant.findOne({
          skuCode: String(item.skuCode).trim().toUpperCase(),
          store,
        }).session(session);
      }

      if (!variant) {
        throw new Error(
          `Variant not found. SKU: ${item.skuCode || "-"}, Variant ID: ${item.variant || "-"}`
        );
      }

      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`Quantity for ${variant.skuCode} must be greater than 0.`);
      }

      totalQuantity += qty;

      transferItems.push({
        product: variant.product,
        variant: variant._id,
        batch: item.batch || null,
        skuCode: variant.skuCode,
        quantity: qty,
      });
    }

    const [transfer] = await StockTransfer.create(
      [
        {
          transferNo,
          store,
          fromWarehouse,
          toWarehouse,
          items: transferItems,
          totalItems: transferItems.length,
          totalQuantity,
          remarks: remarks || "",
          status: "completed",
          createdBy: userId,
        },
      ],
      { session }
    );

    // Execute stock movements
    for (const item of transferItems) {
      await moveStock({
        variantId: item.variant,
        batchId: item.batch || null,
        quantity: item.quantity,
        operation: "transfer_out",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: transfer.transferNo,
        store,
        warehouse: fromWarehouse,
        createdBy: userId,
        remarks: "Warehouse Transfer Out",
        allowNegative: true,
        session,
      });

      await moveStock({
        variantId: item.variant,
        batchId: item.batch || null,
        quantity: item.quantity,
        operation: "transfer_in",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: transfer.transferNo,
        store,
        warehouse: toWarehouse,
        createdBy: userId,
        remarks: "Warehouse Transfer In",
        allowNegative: true,
        session,
      });
    }

    await session.commitTransaction();
    session.endSession();

    const data = await StockTransfer.findById(transfer._id)
      .populate("store", "storeName name")
      .populate("fromWarehouse", "warehouseName name")
      .populate("toWarehouse", "warehouseName name")
      .populate("items.product", "productName name")
      .populate("items.variant", "variantName skuCode name")
      .populate("createdBy", "name email");

    return success(res, "Stock transfer created successfully.", data, 201);
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Create Stock Transfer Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to create stock transfer.",
    });
  }
});

/* ============================================================
   GET ALL STOCK TRANSFERS
============================================================ */
exports.getStockTransfer = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    store,
    fromWarehouse,
    toWarehouse,
    fromDate,
    toDate,
  } = req.query;

  const filter = { isDeleted: { $ne: true } };

  if (status) filter.status = status;
  if (store) filter.store = store;
  if (fromWarehouse) filter.fromWarehouse = fromWarehouse;
  if (toWarehouse) filter.toWarehouse = toWarehouse;

  if (search) {
    filter.transferNo = { $regex: search, $options: "i" };
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await StockTransfer.countDocuments(filter);

  const transfers = await StockTransfer.find(filter)
    .populate("store", "storeName name")
    .populate("fromWarehouse", "warehouseName name")
    .populate("toWarehouse", "warehouseName name")
    .populate("items.product", "productName name")
    .populate("items.variant", "variantName skuCode name barcode")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("cancelledBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return success(res, "Stock transfer list fetched successfully.", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
    count: transfers.length,
    data: transfers,
  });
});

/* ============================================================
   GET STOCK TRANSFER BY ID
============================================================ */
exports.getStockTransferById = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  })
    .populate("store", "storeName name")
    .populate("fromWarehouse", "warehouseName name")
    .populate("toWarehouse", "warehouseName name")
    .populate("items.product", "productName name")
    .populate("items.variant", "variantName skuCode name barcode")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("cancelledBy", "name email");

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: "Stock transfer not found.",
    });
  }

  return success(res, "Stock transfer details fetched successfully.", transfer);
});

/* ============================================================
   UPDATE STOCK TRANSFER (WITH AUTOMATIC INVENTORY RE-SYNC)
============================================================ */
exports.updateStockTransferById = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.user?.userId;
  const { store, fromWarehouse, toWarehouse, items, remarks } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transfer = await StockTransfer.findById(req.params.id).session(session);

    if (!transfer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found.",
      });
    }

    if (transfer.status === "cancelled") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Cancelled stock transfers cannot be edited.",
      });
    }

    // 1. Reverse the previous transfer movements
    for (const item of transfer.items) {
      const variantId = item.variant?._id || item.variant;
      await moveStock({
        variantId,
        batchId: item.batch || null,
        quantity: item.quantity,
        operation: "transfer_out",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: `${transfer.transferNo}-EDIT-REVERSE`,
        store: transfer.store,
        warehouse: transfer.toWarehouse,
        createdBy: userId,
        remarks: "Reverse Destination on Edit",
        allowNegative: true,
        session,
      });

      await moveStock({
        variantId,
        batchId: item.batch || null,
        quantity: item.quantity,
        operation: "transfer_in",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: `${transfer.transferNo}-EDIT-REVERSE`,
        store: transfer.store,
        warehouse: transfer.fromWarehouse,
        createdBy: userId,
        remarks: "Restore Origin on Edit",
        allowNegative: true,
        session,
      });
    }

    // 2. Validate and prepare updated items
    const newStore = store || transfer.store;
    const newFromWh = fromWarehouse || transfer.fromWarehouse;
    const newToWh = toWarehouse || transfer.toWarehouse;
    const newItems = items && items.length ? items : transfer.items;

    let totalQuantity = 0;
    const transferItems = [];

    for (const item of newItems) {
      let variant = null;
      const varId = item.variant?._id || item.variant;

      if (varId && mongoose.Types.ObjectId.isValid(varId)) {
        variant = await ProductVariant.findOne({
          _id: varId,
          store: newStore,
        }).session(session);
      }

      if (!variant && item.skuCode) {
        variant = await ProductVariant.findOne({
          skuCode: String(item.skuCode).trim().toUpperCase(),
          store: newStore,
        }).session(session);
      }

      if (!variant) {
        throw new Error(
          `Variant not found: ${item.skuCode || varId}`
        );
      }

      const qty = Number(item.quantity);
      totalQuantity += qty;

      transferItems.push({
        product: variant.product,
        variant: variant._id,
        batch: item.batch || null,
        skuCode: variant.skuCode,
        quantity: qty,
      });
    }

    // 3. Apply the new transfer movements
    for (const item of transferItems) {
      await moveStock({
        variantId: item.variant,
        batchId: item.batch || null,
        quantity: item.quantity,
        operation: "transfer_out",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: `${transfer.transferNo}-UPDATED`,
        store: newStore,
        warehouse: newFromWh,
        createdBy: userId,
        remarks: "Updated Warehouse Transfer Out",
        allowNegative: true,
        session,
      });

      await moveStock({
        variantId: item.variant,
        batchId: item.batch || null,
        quantity: item.quantity,
        operation: "transfer_in",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: `${transfer.transferNo}-UPDATED`,
        store: newStore,
        warehouse: newToWh,
        createdBy: userId,
        remarks: "Updated Warehouse Transfer In",
        allowNegative: true,
        session,
      });
    }

    // 4. Update Document
    transfer.store = newStore;
    transfer.fromWarehouse = newFromWh;
    transfer.toWarehouse = newToWh;
    transfer.items = transferItems;
    transfer.totalItems = transferItems.length;
    transfer.totalQuantity = totalQuantity;
    transfer.remarks = remarks !== undefined ? remarks : transfer.remarks;
    transfer.updatedBy = userId;

    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    const data = await StockTransfer.findById(transfer._id)
      .populate("store", "storeName name")
      .populate("fromWarehouse", "warehouseName name")
      .populate("toWarehouse", "warehouseName name")
      .populate("items.product", "productName name")
      .populate("items.variant", "variantName skuCode name")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return success(res, "Stock transfer updated successfully.", data);
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Update Stock Transfer Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update stock transfer.",
    });
  }
});

/* ============================================================
   CANCEL STOCK TRANSFER (WITH INVENTORY REVERSAL)
============================================================ */
exports.cancelStockTransfer = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id || req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found.",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transfer = await StockTransfer.findById(req.params.id).session(session);

    if (!transfer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Stock transfer not found.",
      });
    }

    if (transfer.status === "cancelled") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Stock transfer is already cancelled.",
      });
    }

    // Reverse destination and source warehouse inventory
    for (const item of transfer.items) {
      const variantId = item.variant?._id || item.variant;

      // Deduct from destination warehouse
      await moveStock({
        variantId,
        batchId: item.batch || null,
        quantity: Number(item.quantity),
        operation: "transfer_out",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: `${transfer.transferNo}-CANCEL`,
        store: transfer.store,
        warehouse: transfer.toWarehouse,
        createdBy: userId,
        remarks: "Reverse Transfer Out (Cancellation)",
        allowNegative: true,
        session,
      });

      // Restore to source warehouse
      await moveStock({
        variantId,
        batchId: item.batch || null,
        quantity: Number(item.quantity),
        operation: "transfer_in",
        referenceId: transfer._id,
        referenceModel: "StockTransfer",
        referenceNumber: `${transfer.transferNo}-CANCEL`,
        store: transfer.store,
        warehouse: transfer.fromWarehouse,
        createdBy: userId,
        remarks: "Reverse Transfer In (Cancellation)",
        allowNegative: true,
        session,
      });
    }

    transfer.status = "cancelled";
    transfer.cancelledBy = userId;
    transfer.cancelledAt = new Date();
    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    const data = await StockTransfer.findById(transfer._id)
      .populate("store", "storeName name")
      .populate("fromWarehouse", "warehouseName name")
      .populate("toWarehouse", "warehouseName name")
      .populate("items.product", "productName name")
      .populate("items.variant", "variantName skuCode name")
      .populate("createdBy", "name email")
      .populate("cancelledBy", "name email");

    return success(res, "Stock transfer cancelled successfully.", data);
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Cancel Stock Transfer Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to cancel stock transfer.",
    });
  }
});

/* ============================================================
   DELETE STOCK TRANSFER
============================================================ */
exports.deleteStockTransferById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Stock Transfer ID",
    });
  }

  const deletedTransfer = await StockTransfer.findByIdAndDelete(id);

  if (!deletedTransfer) {
    return res.status(404).json({
      success: false,
      message: "Stock transfer not found or already deleted.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Stock transfer deleted successfully.",
    data: {
      transferId: deletedTransfer._id,
      transferNo: deletedTransfer.transferNo,
    },
  });
});