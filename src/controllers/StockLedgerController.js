const StockLedger = require("../models/StockLedger");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/responseHandler");

const success = response.success;

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

  // Validation
  if (!store)
    return res.status(400).json({
      success: false,
      message: "Store is required",
    });

  if (!product)
    return res.status(400).json({
      success: false,
      message: "Product is required",
    });

  if (!variant)
    return res.status(400).json({
      success: false,
      message: "Variant is required",
    });

  if (!movementType)
    return res.status(400).json({
      success: false,
      message: "Movement Type is required",
    });

  if (!quantity)
    return res.status(400).json({
      success: false,
      message: "Quantity is required",
    });

  // Get createdBy from JWT or Postman
  const userId = req.user?._id || createdBy;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "createdBy is required",
    });
  }

  const ledger = await StockLedger.create({
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
    createdBy: userId,
  });

  const data = await StockLedger.findById(ledger._id)
    .populate("store")
    .populate("warehouse")
    .populate("batch")
    .populate("product")
    .populate("variant")
    .populate("createdBy", "name email");

  return success(res, "Stock Ledger created successfully.", data, 201);
});


exports.getStockLedger = asyncHandler(async (req, res) => {

  const {

    page = 1,

    limit = 10,

    search,

    store,

    warehouse,

    product,

    variant,

    movementType,

    fromDate,

    toDate,

  } = req.query;



  const filter = {};



  if (store) filter.store = store;

  if (warehouse) filter.warehouse = warehouse;

  if (product) filter.product = product;

  if (variant) filter.variant = variant;

  if (movementType) filter.movementType = movementType;



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



  // Search SKU / Barcode / Reference Number

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

    .populate("store", "storeName")

    .populate("warehouse", "warehouseName")

    .populate("batch", "batchNo")

    .populate("product", "productName")

    .populate("variant", "variantName skuCode")

    .populate("createdBy", "name email")

    .sort({ createdAt: -1 })

    .skip(skip)

    .limit(Number(limit));



  success(res, "Stock ledger list fetched successfully.", {

    total,

    currentPage: Number(page),

    totalPages: Math.ceil(total / limit),

    count: data.length,

    data,

  });

});

exports.getStockLedgerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await StockLedger.findById(id)
    .populate("store", "storeName")
    .populate("warehouse", "warehouseName")
    .populate("batch", "batchNo")
    .populate("product", "productName")
    .populate("variant", "variantName skuCode")
    .populate("createdBy", "name email");

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Stock ledger not found.",
    });
  }

  success(res, "Stock ledger details fetched successfully.", data);
});

exports.updateStockLedgerById = asyncHandler(async (req, res) => {
  const data = await StockLedger.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("store", "storeName")
    .populate("warehouse", "warehouseName")
    .populate("batch", "batchNo")
    .populate("product", "productName")
    .populate("variant", "variantName skuCode")
    .populate("createdBy", "name email");

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Stock ledger not found.",
    });
  }

  success(res, "Stock ledger updated successfully.", data);
});
exports.deleteStockLedgerById = asyncHandler(async (req, res) => {
  const data = await StockLedger.findByIdAndDelete(req.params.id);

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Stock ledger not found.",
    });
  }

  success(res, "Stock ledger deleted successfully.");
});