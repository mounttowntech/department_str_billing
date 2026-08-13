const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const DepartmentSubCategory = require("../models/DepartmentSubCategory");

// =====================================================
// CREATE SUB CATEGORY
// =====================================================

exports.createDepartmentSubCategory = async (req, res) => {
  try {
    const {
      store,
      category,
      subCategoryCode,
      subCategoryName,
      displayName,
      description,
      taxSetting,
      shelfLifeDays,
      requiresBatch,
      requiresExpiry,
      allowDiscount,
      allowReturn,
      displayOrder,
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

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!subCategoryCode) {
      return res.status(400).json({
        success: false,
        message: "Sub Category Code is required",
      });
    }

    if (!subCategoryName) {
      return res.status(400).json({
        success: false,
        message: "Sub Category Name is required",
      });
    }

    // ===============================
    // Image Upload
    // ===============================

    let image = "";

    if (
      req.files &&
      req.files.image &&
      req.files.image.length > 0
    ) {
      image =
        "/uploads/categories/" +
        req.files.image[0].filename;
    }

    // ===============================
    // Icon Upload
    // ===============================

    let icon = "";

    if (
      req.files &&
      req.files.icon &&
      req.files.icon.length > 0
    ) {
      icon =
        "/uploads/categories/" +
        req.files.icon[0].filename;
    }

    const subCategory =
      await DepartmentSubCategory.create({
        store,
        category,

        subCategoryCode:
          subCategoryCode.trim().toUpperCase(),

        subCategoryName:
          subCategoryName.trim(),

        displayName:
          displayName || subCategoryName,

        description,

        image,
        icon,

        taxSetting: taxSetting || null,

        shelfLifeDays:
          Number(shelfLifeDays) || 0,

        requiresBatch:
          requiresBatch === "true" ||
          requiresBatch === true,

        requiresExpiry:
          requiresExpiry === "true" ||
          requiresExpiry === true,

        allowDiscount:
          allowDiscount === undefined
            ? true
            : allowDiscount === "true" ||
              allowDiscount === true,

        allowReturn:
          allowReturn === undefined
            ? true
            : allowReturn === "true" ||
              allowReturn === true,

        displayOrder:
          Number(displayOrder) || 1,

        status: status || "active",

        createdBy: req.user?.id,
      });

    const result =
      await DepartmentSubCategory.findById(
        subCategory._id
      )
        .populate("store", "storeName")
        .populate(
          "category",
          "categoryName categoryCode"
        )
        .populate(
          "taxSetting",
          "taxName totalTax"
        );

    res.status(201).json({
      success: true,
      message:
        "Sub Category created successfully",
      data: result,
    });

  } catch (error) {

    console.log(error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Sub Category Code already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =====================================================
// GET ALL SUB CATEGORIES
// =====================================================

exports.getAllDepartmentSubCategory = async (req, res) => {
  try {

    const {
      search,
      store,
      category,
      status,
    } = req.query;

    const filter = {};

    if (store) {
      filter.store = store;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        {
          subCategoryCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          subCategoryName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          displayName: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const data =
      await DepartmentSubCategory.find(filter)
        .populate(
          "store",
          "storeName storeCode"
        )
        .populate(
          "category",
          "categoryName categoryCode"
        )
        .populate(
          "taxSetting",
          "taxName totalTax taxCode"
        )
        .sort({
          displayOrder: 1,
          createdAt: -1,
        });

    res.json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// GET SUB CATEGORY BY ID
// =====================================================

exports.getDepartmentSubCategoryById =
async (req, res) => {

  try {

    const subCategory =
      await DepartmentSubCategory.findById(
        req.params.id
      )
        .populate(
          "store",
          "storeName storeCode"
        )
        .populate(
          "category",
          "categoryName categoryCode"
        )
        .populate(
          "taxSetting",
          "taxName totalTax taxCode"
        );

    if (!subCategory) {

      return res.status(404).json({
        success: false,
        message: "Sub Category not found",
      });

    }

    res.json({
      success: true,
      data: subCategory,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
// =====================================================
// UPDATE SUB CATEGORY
// =====================================================

exports.updateDepartmentSubCategory = async (req, res) => {
  try {

    const {
      store,
      category,
      subCategoryCode,
      subCategoryName,
      displayName,
      description,
      taxSetting,
      shelfLifeDays,
      requiresBatch,
      requiresExpiry,
      allowDiscount,
      allowReturn,
      displayOrder,
      status,
    } = req.body;

    // ==========================
    // Validation
    // ==========================

    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Store is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!subCategoryCode) {
      return res.status(400).json({
        success: false,
        message: "Sub Category Code is required",
      });
    }

    if (!subCategoryName) {
      return res.status(400).json({
        success: false,
        message: "Sub Category Name is required",
      });
    }

    const subCategory =
      await DepartmentSubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found",
      });
    }

    // ==========================
    // IMAGE UPDATE
    // ==========================

    let image = subCategory.image;

    if (
      req.files &&
      req.files.image &&
      req.files.image.length > 0
    ) {

      if (image) {

        const oldImage = path.join(
          __dirname,
          "../../",
          image
        );

        if (fs.existsSync(oldImage)) {
          fs.unlinkSync(oldImage);
        }

      }

      image =
        "/uploads/categories/" +
        req.files.image[0].filename;
    }

    // ==========================
    // ICON UPDATE
    // ==========================

    let icon = subCategory.icon;

    if (
      req.files &&
      req.files.icon &&
      req.files.icon.length > 0
    ) {

      if (icon) {

        const oldIcon = path.join(
          __dirname,
          "../../",
          icon
        );

        if (fs.existsSync(oldIcon)) {
          fs.unlinkSync(oldIcon);
        }

      }

      icon =
        "/uploads/categories/" +
        req.files.icon[0].filename;
    }

    // ==========================
    // UPDATE
    // ==========================

    subCategory.store = store;

    subCategory.category = category;

    subCategory.subCategoryCode =
      subCategoryCode.trim().toUpperCase();

    subCategory.subCategoryName =
      subCategoryName.trim();

    subCategory.displayName =
      displayName || subCategoryName;

    subCategory.description =
      description || "";

    subCategory.image = image;

    subCategory.icon = icon;

    subCategory.taxSetting =
      taxSetting || null;

    subCategory.shelfLifeDays =
      Number(shelfLifeDays) || 0;

    subCategory.requiresBatch =
      requiresBatch === "true" ||
      requiresBatch === true;

    subCategory.requiresExpiry =
      requiresExpiry === "true" ||
      requiresExpiry === true;

    subCategory.allowDiscount =
      allowDiscount === "true" ||
      allowDiscount === true;

    subCategory.allowReturn =
      allowReturn === "true" ||
      allowReturn === true;

    subCategory.displayOrder =
      Number(displayOrder) || 1;

    subCategory.status =
      status || "active";

    subCategory.updatedBy =
      req.user?.id;

    await subCategory.save();

    const result =
      await DepartmentSubCategory.findById(
        subCategory._id
      )
        .populate(
          "store",
          "storeName storeCode"
        )
        .populate(
          "category",
          "categoryName categoryCode"
        )
        .populate(
          "taxSetting",
          "taxName totalTax"
        );

    res.json({
      success: true,
      message: "Sub Category updated successfully",
      data: result,
    });

  } catch (error) {

    console.log(error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Sub Category Code already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// =====================================================
// ACTIVATE SUB CATEGORY
// =====================================================

exports.activateDepartmentSubCategory = async (req, res) => {
  try {

    const subCategory =
      await DepartmentSubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found",
      });
    }

    subCategory.status = "active";
    subCategory.updatedBy = req.user?.id;

    await subCategory.save();

    res.json({
      success: true,
      message: "Sub Category activated successfully",
      data: subCategory,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// DEACTIVATE SUB CATEGORY
// =====================================================

exports.deactivateDepartmentSubCategory = async (req, res) => {
  try {

    const subCategory =
      await DepartmentSubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found",
      });
    }

    subCategory.status = "inactive";
    subCategory.updatedBy = req.user?.id;

    await subCategory.save();

    res.json({
      success: true,
      message: "Sub Category deactivated successfully",
      data: subCategory,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// =====================================================
// DELETE SUB CATEGORY
// =====================================================

exports.deleteDepartmentSubCategory = async (req, res) => {
  try {

    const subCategory =
      await DepartmentSubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub Category not found",
      });
    }

    // -------------------------
    // Delete Image
    // -------------------------

    if (subCategory.image) {

      const imagePath = path.join(
        __dirname,
        "../../",
        subCategory.image
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

    }

    // -------------------------
    // Delete Icon
    // -------------------------

    if (subCategory.icon) {

      const iconPath = path.join(
        __dirname,
        "../../",
        subCategory.icon
      );

      if (fs.existsSync(iconPath)) {
        fs.unlinkSync(iconPath);
      }

    }

    await DepartmentSubCategory.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Sub Category deleted successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};