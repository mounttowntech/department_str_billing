const CustomerAddress = require("../models/CustomerAddress");

exports.createCustomerAddress = async (req, res) => {
  try {
    if (req.body.isDefault) {
      await CustomerAddress.updateMany(
        {
          store: req.body.store,
          customer: req.body.customer,
        },
        { isDefault: false }
      );
    }

    const address = await CustomerAddress.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Customer address created successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllCustomerAddress = async (req, res) => {
  try {
    const { store, customer, status, label } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (customer) filter.customer = customer;
    if (status) filter.status = status;
    if (label) filter.label = label;

    const addresses = await CustomerAddress.find(filter)
      .populate("store", "storeName storeCode")
      .populate("customer", "customerName phone email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomerAddressById = async (req, res) => {
  try {
    const address = await CustomerAddress.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("customer", "customerName phone email");

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Customer address not found",
      });
    }

    res.json({
      success: true,
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateCustomerAddress = async (req, res) => {
  try {
    const oldAddress = await CustomerAddress.findById(req.params.id);

    if (!oldAddress) {
      return res.status(404).json({
        success: false,
        message: "Customer address not found",
      });
    }

    if (req.body.isDefault) {
      await CustomerAddress.updateMany(
        {
          store: req.body.store || oldAddress.store,
          customer: req.body.customer || oldAddress.customer,
        },
        { isDefault: false }
      );
    }

    const address = await CustomerAddress.findByIdAndUpdate(
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

    res.json({
      success: true,
      message: "Customer address updated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteCustomerAddress = async (req, res) => {
  try {
    const address = await CustomerAddress.findByIdAndUpdate(
      req.params.id,
      {
        status: "inactive",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Customer address not found",
      });
    }

    res.json({
      success: true,
      message: "Customer address deactivated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.activateCustomerAddress = async (req, res) => {
  try {
    const address = await CustomerAddress.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?.id,
      },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Customer address not found",
      });
    }

    res.json({
      success: true,
      message: "Customer address activated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};