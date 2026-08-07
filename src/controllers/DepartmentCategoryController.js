const mongoose = require("mongoose");
const DepartmentCategory = require("../models/DepartmentCategory");

// =====================================================
// CREATE CATEGORY
// =====================================================

exports.createDepartmentCategory = async (req, res) => {
  try {
    const {
      store,
      categoryCode,
      categoryName,
      displayName,
      description,
      image,
      icon,
      departmentType,
      taxSetting,
      displayOrder,
      isFeatured,
      allowDiscount,
      allowReturn,
    } = req.body;

    // -----------------------------
    // REQUIRED STORE
    // -----------------------------

    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(store)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID.",
      });
    }

    // -----------------------------
    // REQUIRED FIELDS
    // -----------------------------

    if (!categoryCode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category code is required.",
      });
    }

    if (!categoryName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    // -----------------------------
    // TAX
    // Empty tax = null
    // -----------------------------

    let validTaxSetting = null;

    if (taxSetting) {
      if (!mongoose.Types.ObjectId.isValid(taxSetting)) {
        return res.status(400).json({
          success: false,
          message: "Invalid tax setting.",
        });
      }

      validTaxSetting = taxSetting;
    }

    // -----------------------------
    // CREATE
    // -----------------------------

    const category = await DepartmentCategory.create({
      store,

      categoryCode: categoryCode.trim(),

      categoryName: categoryName.trim(),

      displayName:
        displayName?.trim() ||
        categoryName.trim(),

      description:
        description?.trim() || "",

      image:
        image?.trim() || "",

      icon:
        icon?.trim() || "",

      departmentType:
        departmentType || "department_store",

      taxSetting: validTaxSetting,

      displayOrder:
        Number(displayOrder) || 1,

      isFeatured:
        Boolean(isFeatured),

      allowDiscount:
        allowDiscount !== undefined
          ? Boolean(allowDiscount)
          : true,

      allowReturn:
        allowReturn !== undefined
          ? Boolean(allowReturn)
          : true,

      createdBy: req.user?.id,
    });

    // -----------------------------
    // RETURN POPULATED DATA
    // -----------------------------

    const populatedCategory =
      await DepartmentCategory.findById(category._id)
        .populate(
          "store",
          "storeName storeCode"
        )
        .populate(
          "taxSetting",
          "taxCode taxName totalTax"
        );

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: populatedCategory,
    });

  } catch (error) {

    console.error(
      "CREATE CATEGORY ERROR:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Category code or category name already exists in this store.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
    
  }
};


// =====================================================
// GET ALL CATEGORIES
// =====================================================

exports.getAllDepartmentCategory = async (
  req,
  res
) => {
  try {

    const {
      store,
      status,
      departmentType,
      search,
    } = req.query;

    const filter = {};

    if (store) {
      filter.store = store;
    }

    if (status) {
      filter.status = status;
    }

    if (departmentType) {
      filter.departmentType =
        departmentType;
    }

    if (search) {
      filter.$or = [
        {
          categoryCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          categoryName: {
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

    const categories =
      await DepartmentCategory.find(filter)
        .populate(
          "store",
          "storeName storeCode"
        )
        .populate(
          "taxSetting",
          "taxCode taxName totalTax taxType"
        )
        .populate(
          "createdBy",
          "firstName lastName email"
        )
        .populate(
          "updatedBy",
          "firstName lastName email"
        )
        .sort({
          displayOrder: 1,
          createdAt: -1,
        });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });

  } catch (error) {

    console.error(
      "GET CATEGORY ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// GET CATEGORY BY ID
// =====================================================

exports.getDepartmentCategoryById =
  async (req, res) => {

    try {

      const category =
        await DepartmentCategory.findById(
          req.params.id
        )
          .populate(
            "store",
            "storeName storeCode"
          )
          .populate(
            "taxSetting",
            "taxCode taxName totalTax taxType"
          );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      res.json({
        success: true,
        data: category,
      });

    } catch (error) {

      console.error(
        "GET CATEGORY BY ID ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


// =====================================================
// UPDATE CATEGORY
// =====================================================

exports.updateDepartmentCategory =
  async (req, res) => {

    try {

      const {
        store,
        categoryCode,
        categoryName,
        displayName,
        description,
        image,
        icon,
        departmentType,
        taxSetting,
        displayOrder,
        isFeatured,
        allowDiscount,
        allowReturn,
      } = req.body;

      // -----------------------------
      // STORE
      // -----------------------------

      if (!store) {
        return res.status(400).json({
          success: false,
          message: "Please select a store.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(store)) {
        return res.status(400).json({
          success: false,
          message: "Invalid store ID.",
        });
      }

      // -----------------------------
      // REQUIRED
      // -----------------------------

      if (!categoryCode?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category code is required.",
        });
      }

      if (!categoryName?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required.",
        });
      }

      // -----------------------------
      // TAX
      // -----------------------------

      let validTaxSetting = null;

      if (taxSetting) {

        if (
          !mongoose.Types.ObjectId.isValid(
            taxSetting
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid tax setting.",
          });
        }

        validTaxSetting = taxSetting;
      }

      // -----------------------------
      // UPDATE
      // -----------------------------

      const category =
        await DepartmentCategory.findByIdAndUpdate(
          req.params.id,
          {
            store,

            categoryCode:
              categoryCode.trim(),

            categoryName:
              categoryName.trim(),

            displayName:
              displayName?.trim() ||
              categoryName.trim(),

            description:
              description?.trim() || "",

            image: req.file
  ? `/uploads/${req.file.filename}`
  : "",

            icon:
  typeof icon === "string"
    ? icon.trim()
    : icon || "",

            departmentType:
              departmentType ||
              "department_store",

            taxSetting:
              validTaxSetting,

            displayOrder:
              Number(displayOrder) || 1,

            isFeatured:
              Boolean(isFeatured),

            allowDiscount:
              Boolean(allowDiscount),

            allowReturn:
              Boolean(allowReturn),

            updatedBy:
              req.user?.id,
          },
          {
            new: true,
            runValidators: true,
          }
        )
          .populate(
            "store",
            "storeName storeCode"
          )
          .populate(
            "taxSetting",
            "taxCode taxName totalTax taxType"
          );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Category updated successfully.",
        data: category,
      });

    } catch (error) {

      console.error(
        "UPDATE CATEGORY ERROR:",
        error
      );

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message:
            "Category code or category name already exists in this store.",
        });
      }

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


// =====================================================
// TOGGLE ACTIVE / INACTIVE
// =====================================================

exports.toggleDepartmentCategory =
  async (req, res) => {

    try {

      const category =
        await DepartmentCategory.findById(
          req.params.id
        );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      // ACTIVE -> INACTIVE
      // INACTIVE -> ACTIVE

      category.status =
        category.status === "active"
          ? "inactive"
          : "active";

      category.updatedBy =
        req.user?.id;

      await category.save();

      const populatedCategory =
        await DepartmentCategory.findById(
          category._id
        )
          .populate(
            "store",
            "storeName storeCode"
          )
          .populate(
            "taxSetting",
            "taxCode taxName totalTax"
          );

      res.json({
        success: true,

        message:
          category.status === "active"
            ? "Category activated successfully."
            : "Category deactivated successfully.",

        data: populatedCategory,
      });

    } catch (error) {

      console.error(
        "TOGGLE CATEGORY ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


// =====================================================
// DELETE CATEGORY
// =====================================================

exports.deleteDepartmentCategory =
  async (req, res) => {

    try {

      const category =
        await DepartmentCategory.findByIdAndDelete(
          req.params.id
        );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Category deleted successfully.",
        data: category,
      });

    } catch (error) {

      console.error(
        "DELETE CATEGORY ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };