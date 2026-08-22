const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");
const Model = require("../models/Barcode");

exports.createBarcode = asyncHandler(async (req, res) => {
  try {
    const data = await Model.create({
      ...req.body,
      createdBy: req.user?._id || req.user?.id,
    });

    success(res, "Barcode created", data, 201);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Barcode already exists in this store",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.getAllBarcode = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status !== undefined) {
    filter.status = req.query.status === "true";
  }

  if (req.query.store) filter.store = req.query.store;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.variant) filter.variant = req.query.variant;
  if (req.query.barcodeType) filter.barcodeType = req.query.barcodeType;

  if (req.query.search) {
    filter.$or = [
      { barcode: { $regex: req.query.search, $options: "i" } },
      { skuCode: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const data = await Model.find(filter)
    .populate("store", "storeName storeCode")
    .populate("product", "productName productCode")
    .populate("variant", "skuCode barcode variantName")
    .populate("batch", "batchNumber")
    .sort({ createdAt: -1 });

  success(res, "Barcode list", data);
});

exports.getBarcodeById = asyncHandler(async (req, res) => {
  const data = await Model.findById(req.params.id)
    .populate("store", "storeName storeCode")
    .populate("product", "productName productCode")
    .populate("variant", "skuCode barcode variantName")
    .populate("batch", "batchNumber");

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Barcode not found",
    });
  }

  success(res, "Barcode details", data);
});

exports.updateBarcode = asyncHandler(async (req, res) => {
  try {
    const data = await Model.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id || req.user?.id,
      },
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Barcode not found",
      });
    }

    success(res, "Barcode updated", data);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Barcode already exists in this store",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.deleteBarcode = asyncHandler(async (req, res) => {
  const data = await Model.findByIdAndDelete(req.params.id);

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Barcode not found",
    });
  }

  success(res, "Barcode deleted successfully", data);
});