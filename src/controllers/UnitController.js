const Unit = require("../models/Unit");
const mongoose=require("mongoose");
exports.createUnit = async (req, res) => {
  try {
    const unit = await Unit.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: unit,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Unit Code or Unit Name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllUnits = async (req, res) => {
  try {
    const { store, status, search } = req.query;

    const filter = {};

    if (store) filter.store = store;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { unitCode: { $regex: search, $options: "i" } },
        { unitName: { $regex: search, $options: "i" } },
        { shortName: { $regex: search, $options: "i" } },
      ];
    }

    const units = await Unit.find(filter)
      .populate("store", "storeName")
      .sort({ displayOrder: 1 });

    res.json({
      success: true,
      count: units.length,
      data: units,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.json({
      success: true,
      data: unit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(
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

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.json({
      success: true,
      message: "Unit updated successfully",
      data: unit,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Unit Code or Unit Name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Soft delete — deactivates the unit, keeps the record.


exports.deleteUnit = async (req, res) => {try {const { id } = req.params;

// ==========================================================
// VALIDATE UNIT ID
// ==========================================================

if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid Unit ID",
  });
}

// ==========================================================
// FIND UNIT
// ==========================================================

const unit = await Unit.findById(id);

if (!unit) {
  return res.status(404).json({
    success: false,
    message: "Unit not found",
  });
}

// ==========================================================
// PERMANENT DELETE
// ==========================================================

await Unit.findByIdAndDelete(id);

// ==========================================================
// SUCCESS RESPONSE
// ==========================================================

return res.status(200).json({
  success: true,
  message: "Unit deleted successfully",
  data: {
    unitId: unit._id,
    unitName: unit.name,
  },
});

} catch (error) {console.error("Delete Unit Error:", error);

return res.status(500).json({
  success: false,
  message: error.message || "Failed to delete Unit",
});

}};

exports.activateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?.id,
      },
      {
        new: true,
      }
    );

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.json({
      success: true,
      message: "Unit activated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Hard delete — actually removes the document.
exports.permanentDeleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    // ⚠️ Optional but recommended: block deletion if the unit is still
    // referenced by a Product, the same way RolePermissionController
    // blocks deleting a role that's still assigned to users. Uncomment
    // and adjust the field name to match your actual Product schema:
    //
    // const Product = require("../models/Product");
    // const inUse = await Product.findOne({ unit: unit._id });
    // if (inUse) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Unit is used by one or more products. Cannot delete.",
    //   });
    // }

    await unit.deleteOne();

    res.json({
      success: true,
      message: "Unit deleted permanently",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};