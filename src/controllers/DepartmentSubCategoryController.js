const DepartmentSubCategory = require("../models/DepartmentSubCategory");

exports.createDepartmentSubCategory = async (req, res) => {
  try {
    const subCategory = await DepartmentSubCategory.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Sub category created successfully",
      data: subCategory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Sub category code or name already exists in this store/category",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllDepartmentSubCategory = async (req, res) => {
  try {
    const { store, category, status, search } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { subCategoryCode: { $regex: search, $options: "i" } },
        { subCategoryName: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }

    const subCategories = await DepartmentSubCategory.find(filter)
      .populate("store", "storeName storeCode")
      .populate("category", "categoryName categoryCode")
      .populate("taxSetting", "taxName totalTax")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      count: subCategories.length,
      data: subCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDepartmentSubCategoryById = async (req, res) => {
  try {
    const subCategory = await DepartmentSubCategory.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("category", "categoryName categoryCode")
      .populate("taxSetting", "taxName totalTax")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub category not found",
      });
    }

    res.json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDepartmentSubCategory = async (req, res) => {
  try {
    const subCategory = await DepartmentSubCategory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?.id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub category not found",
      });
    }

    res.json({
      success: true,
      message: "Sub category updated successfully",
      data: subCategory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Sub category code or name already exists in this store/category",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteDepartmentSubCategory = async (req, res) => {
  try {
    const subCategory = await DepartmentSubCategory.findByIdAndUpdate(
      req.params.id,
      {
        status: "inactive",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub category not found",
      });
    }

    res.json({
      success: true,
      message: "Sub category deactivated successfully",
      data: subCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.activateDepartmentSubCategory = async (req, res) => {
  try {
    const subCategory = await DepartmentSubCategory.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Sub category not found",
      });
    }

    res.json({
      success: true,
      message: "Sub category activated successfully",
      data: subCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};