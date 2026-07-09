const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      createdBy: req.user?._id || req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists in this store",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { store, search, category, subCategory, brand, status } = req.query;

    const filter = {};

    if (store) filter.store = store;
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (brand) filter.brand = brand;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { productCode: { $regex: search, $options: "i" } },
        { hsnCode: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("store", "storeName storeCode")
      .populate("category", "categoryName categoryCode")
      .populate("subCategory", "subCategoryName subCategoryCode")
      .populate("brand", "brandName brandCode")
      .populate("unit", "unitName shortName")
      .populate("taxSetting", "taxName totalTax")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("category", "categoryName categoryCode")
      .populate("subCategory", "subCategoryName subCategoryCode")
      .populate("brand", "brandName brandCode")
      .populate("unit", "unitName shortName")
      .populate("taxSetting", "taxName totalTax")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?._id || req.user?.id,
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists in this store",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        status: "inactive",
        updatedBy: req.user?._id || req.user?.id,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deactivated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.activateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?._id || req.user?.id,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product activated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const { store } = req.query;

    const filter = {};
    if (store) filter.store = store;

    const products = await Product.find(filter)
      .populate("category", "categoryName")
      .populate("brand", "brandName")
      .sort({ totalStock: 1 });

    const lowStockProducts = products.filter(
      (item) => Number(item.totalStock || 0) <= Number(item.minimumStock || 0)
    );

    res.json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};