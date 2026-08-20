const Supplier = require("../models/Supplier");
const mongoose = require("mongoose");

/* =========================================================
   DUPLICATE KEY MESSAGE
========================================================= */

const duplicateMessage = (error) => {
  const keyValue = error?.keyValue || {};

  if (keyValue.supplierCode) {
    return `Supplier Code "${keyValue.supplierCode}" already exists for this store.`;
  }

  if (keyValue.supplierName) {
    return `Supplier Name "${keyValue.supplierName}" already exists for this store.`;
  }

  return "Supplier Code or Supplier Name already exists for this store.";
};



exports.createSupplier = async (req, res) => {
  try {
    const { store, supplierCode, supplierName } = req.body;

    console.log("========== CREATE SUPPLIER ==========");
    console.log("STORE:", store);
    console.log("SUPPLIER CODE:", supplierCode);
    console.log("SUPPLIER NAME:", supplierName);

    const existing = await Supplier.findOne({
      store,
      $or: [
        { supplierCode: supplierCode?.trim().toUpperCase() },
        { supplierName: supplierName?.trim() },
      ],
    });

    console.log("EXISTING SUPPLIER:", existing);

    if (existing) {
      console.log("DUPLICATE FOUND:", existing._id);

      return res.status(400).json({
        success: false,
        message: "Supplier Code or Supplier Name already exists for this store.",
      });
    }

    const supplier = await Supplier.create({
      ...req.body,
      supplierCode: supplierCode.trim().toUpperCase(),
      supplierName: supplierName.trim(),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });

  } catch (error) {
    console.error("CREATE SUPPLIER ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Supplier Code or Supplier Name already exists for this store.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAllSuppliers = async (req, res) => {
  try {

    const {
      store,
      status,
      search,
    } = req.query;

    const filter = {};

    /* -----------------------------------------
       STORE FILTER
    ----------------------------------------- */

    if (store) {
      filter.store = store;
    }

    /* -----------------------------------------
       STATUS FILTER
    ----------------------------------------- */

    if (status) {
      filter.status = status;
    }

    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    if (search && search.trim()) {

      const searchValue = search.trim();

      filter.$or = [
        {
          supplierCode: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          supplierName: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          companyName: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          gstNumber: {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];
    }

    /* -----------------------------------------
       FETCH
    ----------------------------------------- */

    const suppliers = await Supplier.find(filter)
      .populate("store", "storeName")
      .sort({
        supplierName: 1,
      });

    return res.json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });

  } catch (error) {

    console.error("GET SUPPLIERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET SUPPLIER BY ID
========================================================= */

exports.getSupplierById = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Supplier ID",
      });
    }

    const supplier = await Supplier.findById(id)
      .populate("store", "storeName");

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.json({
      success: true,
      data: supplier,
    });

  } catch (error) {

    console.error("GET SUPPLIER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   UPDATE SUPPLIER
========================================================= */

exports.updateSupplier = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Supplier ID",
      });
    }

    /* -----------------------------------------
       FIND EXISTING SUPPLIER
    ----------------------------------------- */

    const existingSupplier = await Supplier.findById(id);

    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    /* -----------------------------------------
       STORE
    ----------------------------------------- */

    const store = req.body.store || existingSupplier.store;

    /* -----------------------------------------
       NORMALIZE CODE
    ----------------------------------------- */

    let supplierCode =
      req.body.supplierCode !== undefined
        ? req.body.supplierCode.trim().toUpperCase()
        : existingSupplier.supplierCode;

    /* -----------------------------------------
       NORMALIZE NAME
    ----------------------------------------- */

    let supplierName =
      req.body.supplierName !== undefined
        ? req.body.supplierName.trim()
        : existingSupplier.supplierName;

    /* -----------------------------------------
       CHECK DUPLICATE CODE
    ----------------------------------------- */

    const duplicateCode = await Supplier.findOne({
      store: store,
      supplierCode: supplierCode,
      _id: { $ne: id },
    });

    if (duplicateCode) {
      return res.status(400).json({
        success: false,
        message: `Supplier Code "${supplierCode}" already exists for this store.`,
      });
    }

    /* -----------------------------------------
       CHECK DUPLICATE NAME
    ----------------------------------------- */

    const duplicateName = await Supplier.findOne({
      store: store,
      supplierName: supplierName,
      _id: { $ne: id },
    });

    if (duplicateName) {
      return res.status(400).json({
        success: false,
        message: `Supplier Name "${supplierName}" already exists for this store.`,
      });
    }

    /* -----------------------------------------
       UPDATE
    ----------------------------------------- */

    const updateData = {
      ...req.body,

      store: store,

      supplierCode: supplierCode,

      supplierName: supplierName,

      updatedBy: req.user.id,
    };

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });

  } catch (error) {

    console.error("UPDATE SUPPLIER ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: duplicateMessage(error),
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update supplier",
    });
  }
};


/* =========================================================
   DELETE SUPPLIER
========================================================= */

exports.deleteSupplier = async (req, res) => {
  try {

    const { id } = req.params;

    /* -----------------------------------------
       VALIDATE ID
    ----------------------------------------- */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Supplier ID",
      });
    }

    /* -----------------------------------------
       FIND SUPPLIER
    ----------------------------------------- */

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    /* -----------------------------------------
       DELETE
    ----------------------------------------- */

    await Supplier.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
      data: {
        supplierId: supplier._id,
        supplierName: supplier.supplierName,
      },
    });

  } catch (error) {

    console.error("DELETE SUPPLIER ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to delete supplier",
    });
  }
};

exports.activateSupplier = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Supplier ID",
      });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      {
        status: "active",
        updatedBy: req.user.id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    return res.json({
      success: true,
      message: "Supplier activated successfully",
      data: supplier,
    });

  } catch (error) {

    console.error("ACTIVATE SUPPLIER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};