const mongoose = require("mongoose");
const StockTransfer = require("../models/StockTransfer");
const ProductVariant = require("../models/ProductVariant");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");
const { moveStock } = require("../services/inventoryService");

exports.createStockTransfer = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      store,
      fromWarehouse,
      toWarehouse,
      items,
      remarks,
      createdBy,
    } = req.body;

    if (!store)
      throw new Error("Store is required.");

    if (!fromWarehouse)
      throw new Error("From Warehouse is required.");

    if (!toWarehouse)
      throw new Error("To Warehouse is required.");

    if (fromWarehouse === toWarehouse)
      throw new Error("From Warehouse and To Warehouse cannot be same.");

    if (!items || !items.length)
      throw new Error("Transfer items are required.");

    const transferNo = req.body.transferNo || `STF-${Date.now()}`;

    let totalQuantity = 0;
    const transferItems = [];

    // Validate every item
    for (const item of items) {
      let variant = null;

      // Search by Variant ID
      if (item.variant && mongoose.Types.ObjectId.isValid(item.variant)) {
        variant = await ProductVariant.findOne({
          _id: item.variant,
          store,
          status: "active",
        }).session(session);
      }

      // Search by SKU if variant not found
      if (!variant && item.skuCode) {
        variant = await ProductVariant.findOne({
          skuCode: item.skuCode.toUpperCase(),
          store,
          status: "active",
        }).session(session);
      }

      if (!variant) {
        throw new Error(
          `Variant not found. SKU: ${item.skuCode || "-"}, Variant ID: ${
            item.variant || "-"
          }`
        );
      }

      if (variant.currentStock < item.quantity) {
        throw new Error(
          `${variant.skuCode} has only ${variant.currentStock} stock available.`
        );
      }

      totalQuantity += Number(item.quantity);

      transferItems.push({
        product: variant.product,
        variant: variant._id,
        batch: item.batch,
        skuCode: variant.skuCode,
        quantity: item.quantity,
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
          remarks,
          createdBy: req.user?._id || createdBy,
        },
      ],
      { session }
    );

    // Move stock
    for (const item of transferItems) {
      await moveStock(
        {
          variantId: item.variant,
          batchId: item.batch,
          quantity: item.quantity,
          operation: "transfer_out",
          referenceId: transfer._id,
          referenceModel: "StockTransfer",
          referenceNumber: transfer.transferNo,
          store,
          warehouse: fromWarehouse,
          createdBy: req.user?._id || createdBy,
          remarks: "Warehouse Transfer Out",
        },
        { session }
      );

      await moveStock(
        {
          variantId: item.variant,
          batchId: item.batch,
          quantity: item.quantity,
          operation: "transfer_in",
          referenceId: transfer._id,
          referenceModel: "StockTransfer",
          referenceNumber: transfer.transferNo,
          store,
          warehouse: toWarehouse,
          createdBy: req.user?._id || createdBy,
          remarks: "Warehouse Transfer In",
          allowNegative: true,
        },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    const data = await StockTransfer.findById(transfer._id)
      .populate("store", "storeName")
      .populate("fromWarehouse", "warehouseName")
      .populate("toWarehouse", "warehouseName")
      .populate("items.product", "productName")
      .populate("items.variant", "variantName skuCode")
      .populate("createdBy", "firstName lastName");

    return success(res, "Stock transfer created successfully.", data, 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

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

  const filter = {};

  if (status) filter.status = status;
  if (store) filter.store = store;
  if (fromWarehouse) filter.fromWarehouse = fromWarehouse;
  if (toWarehouse) filter.toWarehouse = toWarehouse;

  // Search by Transfer No
  if (search) {
    filter.transferNo = {
      $regex: search,
      $options: "i",
    };
  }

  // Date Filter
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

  const skip = (Number(page) - 1) * Number(limit);

  const total = await StockTransfer.countDocuments(filter);

  const transfers = await StockTransfer.find(filter)
    .populate("store", "storeName")
    .populate("fromWarehouse", "warehouseName")
    .populate("toWarehouse", "warehouseName")
    .populate("items.product", "productName")
    .populate("items.variant", "variantName skuCode barcode")
    .populate("items.batch", "batchNo")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name")
    .populate("cancelledBy", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return success(res, "Stock transfer list fetched successfully.", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    count: transfers.length,
    data: transfers,
  });
});

exports.getStockTransferById = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findById(req.params.id)
    .populate("store", "storeName")
    .populate("fromWarehouse", "warehouseName")
    .populate("toWarehouse", "warehouseName")
    .populate("items.product", "productName")
    .populate("items.variant", "variantName skuCode barcode")
    .populate("items.batch", "batchNo")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name")
    .populate("cancelledBy", "name");

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: "Stock transfer not found.",
    });
  }

  return success(res, "Stock transfer details fetched successfully.", transfer);
});

exports.updateStockTransferById = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findById(req.params.id);

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: "Stock transfer not found.",
    });
  }

  // Prevent updating completed transfers
  if (transfer.status === "completed") {
    return res.status(400).json({
      success: false,
      message: "Completed stock transfers cannot be updated.",
    });
  }

  Object.assign(transfer, req.body);

  transfer.updatedBy = req.user?._id || req.body.updatedBy;

  await transfer.save();

  const data = await StockTransfer.findById(transfer._id)
    .populate("store", "storeName")
    .populate("fromWarehouse", "warehouseName")
    .populate("toWarehouse", "warehouseName")
    .populate("items.product", "productName")
    .populate("items.variant", "variantName skuCode barcode")
    .populate("items.batch", "batchNo")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  return success(res, "Stock transfer updated successfully.", data);
});

exports.deleteStockTransferById = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findById(req.params.id);

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: "Stock transfer not found.",
    });
  }

  // Prevent deleting completed transfers
  if (transfer.status === "completed") {
    return res.status(400).json({
      success: false,
      message: "Completed stock transfers cannot be deleted.",
    });
  }

  await StockTransfer.findByIdAndDelete(req.params.id);

  return success(res, "Stock transfer deleted successfully.");
});


exports.cancelStockTransfer = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transfer = await StockTransfer.findById(req.params.id).session(session);

    if (!transfer) {
      throw new Error("Stock transfer not found.");
    }

    if (transfer.status === "cancelled") {
      throw new Error("Stock transfer is already cancelled.");
    }

    // Reverse every transferred item
    for (const item of transfer.items) {
      const variant = await ProductVariant.findById(item.variant).session(session);

      if (!variant) {
        throw new Error(`Variant not found: ${item.variant}`);
      }

      // Reverse Transfer IN
      await moveStock(
        {
          variantId: variant._id,
          batchId: item.batch,
          quantity: item.quantity,
          operation: "transfer_out",
          referenceId: transfer._id,
          referenceModel: "StockTransfer",
          referenceNumber: transfer.transferNo,
          store: transfer.store,
          warehouse: transfer.toWarehouse,
          createdBy: req.user?._id || req.body.cancelledBy,
          remarks: "Reverse Transfer Out",
        },
        { session }
      );

      // Reverse Transfer OUT
      await moveStock(
        {
          variantId: variant._id,
          batchId: item.batch,
          quantity: item.quantity,
          operation: "transfer_in",
          referenceId: transfer._id,
          referenceModel: "StockTransfer",
          referenceNumber: transfer.transferNo,
          store: transfer.store,
          warehouse: transfer.fromWarehouse,
          createdBy: req.user?._id || req.body.cancelledBy,
          remarks: "Reverse Transfer In",
          allowNegative: true,
        },
        { session }
      );
    }

    transfer.status = "cancelled";
    transfer.cancelledBy = req.user?._id || req.body.cancelledBy;
    transfer.cancelledAt = new Date();

    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    const data = await StockTransfer.findById(transfer._id)
      .populate("store", "storeName")
      .populate("fromWarehouse", "warehouseName")
      .populate("toWarehouse", "warehouseName")
      .populate("items.product", "productName")
      .populate("items.variant", "variantName skuCode")
      .populate("createdBy", "name email")
      .populate("cancelledBy", "name email");

    return success(res, "Stock transfer cancelled successfully.", data);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});