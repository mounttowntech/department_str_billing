const Batch = require("../models/Batch");

exports.createBatch = async (req, res) => {
  try {
    const batch = await Batch.create({
      ...req.body,
      createdBy: req.user?._id || req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Batch Number already exists for this store.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllBatch = async (req, res) => {
  try {
    const filter = {
      isDeleted: false,
    };

    if (req.query.store) filter.store = req.query.store;
    if (req.query.product) filter.product = req.query.product;
    if (req.query.variant) filter.variant = req.query.variant;
    if (req.query.supplier) filter.supplier = req.query.supplier;
    if (req.query.warehouse) filter.warehouse = req.query.warehouse;
    if (req.query.status) filter.status = req.query.status;

    const batches = await Batch.find(filter)
      .populate("store", "storeName storeCode")
      .populate("product", "productName productCode")
      .populate("variant", "variantName skuCode barcode")
      .populate("supplier", "supplierName supplierCode")
      .populate("purchase", "purchaseNo")
      .populate("warehouse", "warehouseName")
      .populate("shelf", "shelfName rackNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("store", "storeName storeCode")
      .populate("product", "productName productCode")
      .populate("variant", "variantName skuCode barcode")
      .populate("supplier", "supplierName supplierCode")
      .populate("purchase", "purchaseNo")
      .populate("warehouse", "warehouseName")
      .populate("shelf", "shelfName rackNumber");

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id || req.user?.id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      data: batch,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate Batch Number.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        updatedBy: req.user?._id || req.user?.id,
      },
      {
        new: true,
      }
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getExpiredBatch = async (req, res) => {
  try {
    const batches = await Batch.find({
      expiryDate: { $lt: new Date() },
      isDeleted: false,
    })
      .populate("product", "productName")
      .populate("variant", "variantName")
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getLowStockBatch = async (req, res) => {
  try {
    const batches = await Batch.find({
      remainingQuantity: { $lte: 10 },
      isDeleted: false,
    })
      .populate("product", "productName")
      .populate("variant", "variantName")
      .sort({ remainingQuantity: 1 });

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBatchByBarcode = async (req, res) => {
  try {
    const batch = await Batch.findOne({
      barcode: req.params.barcode,
      isDeleted: false,
    })
      .populate("product", "productName")
      .populate("variant", "variantName skuCode");

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBatchByProduct = async (req, res) => {
  try {
    const batches = await Batch.find({
      product: req.params.productId,
      isDeleted: false,
    }).sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};