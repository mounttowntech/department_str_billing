const Warehouse = require("../models/Warehouse");

exports.createWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Warehouse code already exists for this store.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllWarehouses = async (req, res) => {
  try {
    const { store, status, warehouseType, search } = req.query;

    const filter = {};

    if (store) filter.store = store;
    if (status) filter.status = status;
    if (warehouseType) filter.warehouseType = warehouseType;

    if (search) {
      filter.$or = [
        { warehouseCode: { $regex: search, $options: "i" } },
        { warehouseName: { $regex: search, $options: "i" } },
      ];
    }

    const warehouses = await Warehouse.find(filter)
      .populate("store", "storeName storeCode")
      .populate("manager", "employeeCode firstName lastName phone")
      .sort({ warehouseName: 1 });

    res.json({
      success: true,
      count: warehouses.length,
      data: warehouses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("manager", "employeeCode firstName lastName phone email");

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    res.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
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

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    res.json({
      success: true,
      message: "Warehouse updated successfully",
      data: warehouse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Warehouse code already exists for this store.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Flips active <-> inactive in one call (mounted at /activate/:id to
// match Category/Brand convention, even though it toggles both ways)
exports.toggleWarehouseStatus = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    warehouse.status = warehouse.status === "active" ? "inactive" : "active";
    warehouse.updatedBy = req.user?.id;
    await warehouse.save();

    res.json({
      success: true,
      message: `Warehouse ${warehouse.status === "active" ? "activated" : "deactivated"} successfully`,
      data: warehouse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Permanent delete — removes the document entirely
exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    res.json({
      success: true,
      message: "Warehouse permanently deleted",
      data: warehouse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};