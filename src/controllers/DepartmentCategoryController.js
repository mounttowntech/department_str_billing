const DepartmentCategory = require("../models/DepartmentCategory");

exports.createDepartmentCategory = async (req, res) => {
  try {
    const imageURL = req.file
      ? `/uploads/categories/${req.file.filename}`
      : null;

    const category = await DepartmentCategory.create({
      ...req.body,

      imageURL,

      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Category code or category name already exists in this store",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAllDepartmentCategory = async (req, res) => {
  try {
    const { store, status, departmentType, search } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (status) filter.status = status;
    if (departmentType) filter.departmentType = departmentType;

    if (search) {
      filter.$or = [
        { categoryCode: { $regex: search, $options: "i" } },
        { categoryName: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }

    const categories = await DepartmentCategory.find(filter)
      .populate("store", "storeName storeCode")
      .populate("taxSetting", "taxName totalTax")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDepartmentCategoryById = async (req, res) => {
  try {
    const category = await DepartmentCategory.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("taxSetting", "taxName totalTax")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDepartmentCategory = async (req, res) => {
  try {
    const category = await DepartmentCategory.findByIdAndUpdate(
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

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category code or category name already exists in this store",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteDepartmentCategory = async (req, res) => {
  try {
    const category = await DepartmentCategory.findByIdAndUpdate(
      req.params.id,
      {
        status: "inactive",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deactivated successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.activateDepartmentCategory = async (req, res) => {
  try {
    const category = await DepartmentCategory.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category activated successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};