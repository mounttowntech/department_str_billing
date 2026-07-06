const ProductVariant = require("../models/ProductVariant");

exports.createVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Product variant created successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVariants = async (req, res) => {
  try {
    const variants = await ProductVariant.find()
      .populate("store", "storeName storeCode")
      .populate("product", "productName productCode")
      .populate("unit", "unitName shortName")
      .populate("warehouse", "warehouseName")
      .populate("shelf", "shelfName rackNumber")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVariantById = async (req, res) => {
  try {
    const variant = await ProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Variant updated successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    await ProductVariant.findByIdAndUpdate(req.params.id, {
      status: "inactive",
    });

    res.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockVariants = async (req, res) => {
  try {
    const variants = await ProductVariant.find();

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
    const variant = await ProductVariant.findOne({
      barcode: req.params.barcode,
      status: "active",
    });

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};