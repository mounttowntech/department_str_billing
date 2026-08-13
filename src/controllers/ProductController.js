const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");

const toBoolean = (val) => val === true || val === "true";

// Removes an uploaded file from disk given its stored relative URL
// (e.g. "/uploads/products/169..-abc.png"). Safe to call with an
// empty/undefined path. This file lives in src/controllers/, and the
// uploads folder is at the project root, hence "../../".
const removeFile = (relativePath) => {
  if (!relativePath) return;

  const filePath = path.join(
    __dirname,
    "../../",
    relativePath.replace(/^\/+/, "")
  );

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.log("Failed to remove file:", err.message);
    });
  }
};

// =====================================================
// CREATE PRODUCT
// =====================================================

exports.createProduct = async (req, res) => {
  try {
    const {
      store,
      productCode,
      productName,
      displayName,
      category,
      subCategory,
      brand,
      unit,
      taxSetting,
      hsnCode,
      description,
      isBatchRequired,
      isExpiryRequired,
      allowDiscount,
      allowReturn,
      totalStock,
      minimumStock,
      status,
    } = req.body;

    // ===============================
    // Validation
    // ===============================

    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Store is required",
      });
    }

    if (!productCode) {
      return res.status(400).json({
        success: false,
        message: "Product Code is required",
      });
    }

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Product Name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!unit) {
      return res.status(400).json({
        success: false,
        message: "Unit is required",
      });
    }

    // ===============================
    // Image Upload
    // ===============================

    let image = "";

    if (req.file) {
      image = "/uploads/products/" + req.file.filename;
    }

    const product = await Product.create({
      store,
      productCode: productCode.trim().toUpperCase(),
      productName: productName.trim(),
      displayName: displayName || productName,

      category,
      subCategory: subCategory || undefined,
      brand: brand || undefined,
      unit,
      taxSetting: taxSetting || undefined,

      hsnCode,
      description,
      image,

      isBatchRequired: toBoolean(isBatchRequired),
      isExpiryRequired: toBoolean(isExpiryRequired),

      allowDiscount:
        allowDiscount === undefined ? true : toBoolean(allowDiscount),

      allowReturn:
        allowReturn === undefined ? true : toBoolean(allowReturn),

      totalStock: Number(totalStock) || 0,
      minimumStock: minimumStock !== undefined ? Number(minimumStock) : 5,

      status: status || "active",

      createdBy: req.user?._id || req.user?.id,
    });

    const result = await Product.findById(product._id)
      .populate("store", "storeName storeCode")
      .populate("category", "categoryName categoryCode")
      .populate("subCategory", "subCategoryName subCategoryCode")
      .populate("brand", "brandName brandCode")
      .populate("unit", "unitName shortName")
      .populate("taxSetting", "taxName totalTax");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result,
    });
  } catch (error) {
    if (req.file) {
      removeFile(`/uploads/products/${req.file.filename}`);
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists in this store",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================
// GET ALL PRODUCTS
// =====================================================

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

// =====================================================
// GET PRODUCT BY ID
// =====================================================

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

// =====================================================
// UPDATE PRODUCT
// =====================================================

exports.updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);

    if (!existing) {
      if (req.file) {
        removeFile(`/uploads/products/${req.file.filename}`);
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      store,
      productCode,
      productName,
      displayName,
      category,
      subCategory,
      brand,
      unit,
      taxSetting,
      hsnCode,
      description,
      isBatchRequired,
      isExpiryRequired,
      allowDiscount,
      allowReturn,
      totalStock,
      minimumStock,
      status,
      existingImage,
    } = req.body;

    const updates = {
      store: store || existing.store,

      productCode: productCode
        ? productCode.trim().toUpperCase()
        : existing.productCode,

      productName: productName ? productName.trim() : existing.productName,
      displayName: displayName || productName || existing.displayName,

      category: category || existing.category,
      subCategory: subCategory || undefined,
      brand: brand || undefined,
      unit: unit || existing.unit,
      taxSetting: taxSetting || undefined,

      hsnCode: hsnCode !== undefined ? hsnCode : existing.hsnCode,
      description:
        description !== undefined ? description : existing.description,

      isBatchRequired: toBoolean(isBatchRequired),
      isExpiryRequired: toBoolean(isExpiryRequired),

      allowDiscount:
        allowDiscount !== undefined
          ? toBoolean(allowDiscount)
          : existing.allowDiscount,

      allowReturn:
        allowReturn !== undefined
          ? toBoolean(allowReturn)
          : existing.allowReturn,

      totalStock:
        totalStock !== undefined ? Number(totalStock) : existing.totalStock,

      minimumStock:
        minimumStock !== undefined
          ? Number(minimumStock)
          : existing.minimumStock,

      status: status || existing.status,
      updatedBy: req.user?._id || req.user?.id,
    };

    // Image: new file wins; explicit "" means the user removed it;
    // otherwise keep whatever was already saved.
    if (req.file) {
      if (existing.image) removeFile(existing.image);
      updates.image = "/uploads/products/" + req.file.filename;
    } else if (existingImage === "") {
      if (existing.image) removeFile(existing.image);
      updates.image = "";
    } else {
      updates.image =
        existingImage !== undefined ? existingImage : existing.image;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("store", "storeName storeCode")
      .populate("category", "categoryName categoryCode")
      .populate("subCategory", "subCategoryName subCategoryCode")
      .populate("brand", "brandName brandCode")
      .populate("unit", "unitName shortName")
      .populate("taxSetting", "taxName totalTax");

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (req.file) {
      removeFile(`/uploads/products/${req.file.filename}`);
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists in this store",
      });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================
// ACTIVATE PRODUCT
// =====================================================

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

    if (product.status === "inactive") {
      return res.status(400).json({
        success: false,
        message: "Product is already deleted",
      });
    }

    product.status = "inactive";
    product.updatedBy = req.user?._id || req.user?.id;
    product.deletedAt = new Date();
    product.deletedBy = req.user?._id || req.user?.id;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product activated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// =====================================================
// DEACTIVATE PRODUCT
// =====================================================

exports.deactivateProduct = async (req, res) => {
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

// =====================================================
// DELETE PRODUCT (permanent)
// =====================================================

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    removeFile(product.image);

    res.json({
      success: true,
      message: "Product deleted permanently",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================
// TOP SELLING PRODUCTS
// =====================================================

exports.getTopSellingProducts = async (req, res) => {
  try {
    const { store, category, brand, status = "active", limit = 10 } = req.query;

    const filter = {};

    if (store) filter.store = store;
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate("store", "storeName storeCode")
      .populate("category", "categoryName categoryCode")
      .populate("subCategory", "subCategoryName subCategoryCode")
      .populate("brand", "brandName brandCode")
      .populate("unit", "unitName shortName")
      .populate("taxSetting", "taxName totalTax")
      .sort({
        totalSold: -1,
        totalSalesAmount: -1,
      })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      message: "Top selling products fetched successfully",
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// LOW STOCK PRODUCTS
// =====================================================

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