const Shelf = require("../models/Shelf");

exports.createShelf = async (req, res) => {
  try {
    const shelf = await Shelf.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Shelf created successfully",
      data: shelf,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Shelf code already exists in this store",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllShelf = async (req, res) => {
  try {
    const { store, warehouse, status, storageType, search } = req.query;

    const filter = {};

    if (store) filter.store = store;
    if (warehouse) filter.warehouse = warehouse;
    if (status) filter.status = status;
    if (storageType) filter.storageType = storageType;

    if (search) {
      filter.$or = [
        { shelfCode: { $regex: search, $options: "i" } },
        { shelfName: { $regex: search, $options: "i" } },
        { rackNumber: { $regex: search, $options: "i" } },
        { section: { $regex: search, $options: "i" } },
      ];
    }

    const shelves = await Shelf.find(filter)
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ shelfName: 1 });

    res.json({
      success: true,
      count: shelves.length,
      data: shelves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getShelfById = async (req, res) => {
  try {
    const shelf = await Shelf.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName warehouseCode");

    if (!shelf) {
      return res.status(404).json({
        success: false,
        message: "Shelf not found",
      });
    }

    res.json({
      success: true,
      data: shelf,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findByIdAndUpdate(
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

    if (!shelf) {
      return res.status(404).json({
        success: false,
        message: "Shelf not found",
      });
    }

    res.json({
      success: true,
      message: "Shelf updated successfully",
      data: shelf,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Shelf code already exists in this store",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findByIdAndUpdate(
      req.params.id,
      {
        status: "inactive",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!shelf) {
      return res.status(404).json({
        success: false,
        message: "Shelf not found",
      });
    }

    res.json({
      success: true,
      message: "Shelf deactivated successfully",
      data: shelf,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.activateShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!shelf) {
      return res.status(404).json({
        success: false,
        message: "Shelf not found",
      });
    }

    res.json({
      success: true,
      message: "Shelf activated successfully",
      data: shelf,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};