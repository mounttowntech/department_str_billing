const ProductVariant = require("../models/ProductVariant");

exports.createVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.create({
      ...req.body,
      createdBy: req.user?._id || req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Product variant created successfully",
      data: variant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU code or barcode already exists in this store",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVariants = async (req, res) => {
  try {
    const { store, product, status, search } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (product) filter.product = product;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { skuCode: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
        { variantName: { $regex: search, $options: "i" } },
        { packSize: { $regex: search, $options: "i" } },
      ];
    }

    const variants = await ProductVariant.find(filter)
      .populate("store", "storeName storeCode")
      .populate("product", "productName productCode")
      .populate("unit", "unitName shortName")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("shelf", "shelfName shelfCode rackNumber")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: variants.length,
      data: variants,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVariantById = async (req, res) => {
  try {
    const variant = await ProductVariant.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("product", "productName productCode")
      .populate("unit", "unitName shortName")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("shelf", "shelfName shelfCode rackNumber");

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id || req.user?.id,
      },
      { new: true, runValidators: true }
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    res.json({
      success: true,
      message: "Product variant updated successfully",
      data: variant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU code or barcode already exists in this store",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndDelete(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product variant deleted successfully",
      data: variant,
    });
  } catch (error) {
    console.error("Delete variant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product variant",
      error: error.message,
    });
  }
};

exports.activateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?._id || req.user?.id,
      },
      { new: true }
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    res.json({
      success: true,
      message: "Product variant activated successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockVariants = async (req, res) => {
  try {
    const { store } = req.query;

    const filter = {};
    if (store) filter.store = store;

    const variants = await ProductVariant.find(filter)
      .populate("store", "storeName storeCode")
      .populate("product", "productName productCode")
      .populate("warehouse", "warehouseName")
      .populate("shelf", "shelfName rackNumber")
      .sort({ currentStock: 1 });

    const lowStock = variants.filter(
      (v) => Number(v.currentStock || 0) <= Number(v.minimumStock || 0)
    );

    res.json({
      success: true,
      count: lowStock.length,
      data: lowStock,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVariantByBarcode = async (req, res) => {
  try {
    const { store } = req.query;

    const filter = {
      barcode: req.params.barcode,
      status: "active",
    };

    if (store) filter.store = store;

    const variant = await ProductVariant.findOne(filter)
      .populate("product", "productName productCode allowDiscount allowReturn hsnCode")
      .populate("unit", "unitName shortName")
      .populate("warehouse", "warehouseName")
      .populate("shelf", "shelfName rackNumber");

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};