const TaxSetting = require("../models/TaxSetting");


// ==============================
// Create Tax Setting
// ==============================
exports.createTaxSetting = async (req, res) => {
  try {
    const existing = await TaxSetting.findOne({
      taxCode: req.body.taxCode.toUpperCase(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Tax Code already exists",
      });
    }

    const tax = new TaxSetting(req.body);

    await tax.save();

    res.status(201).json({
      success: true,
      message: "Tax Setting created successfully",
      data: tax,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==============================
// Get All Tax Settings
// ==============================
exports.getAllTaxSettings = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 10,
      search,
      status,
      taxType,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        {
          taxCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          taxName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          hsnSacCode: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (status) query.status = status;

    if (taxType) query.taxType = taxType;

    const total = await TaxSetting.countDocuments(query);

    const taxes = await TaxSetting.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      data: taxes,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==============================
// Get Tax Setting By Id
// ==============================
exports.getTaxSettingById = async (req, res) => {

  try {

    const tax = await TaxSetting.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!tax) {
      return res.status(404).json({
        success: false,
        message: "Tax Setting not found",
      });
    }

    res.json({
      success: true,
      data: tax,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// ==============================
// Update Tax Setting
// ==============================
exports.updateTaxSetting = async (req, res) => {

  try {

    if (req.body.taxCode) {
      req.body.taxCode = req.body.taxCode.toUpperCase();
    }

    const tax = await TaxSetting.findById(req.params.id);

    if (!tax) {
      return res.status(404).json({
        success: false,
        message: "Tax Setting not found",
      });
    }

    Object.assign(tax, req.body);

    tax.totalTax =
      Number(tax.cgst || 0) +
      Number(tax.sgst || 0) +
      Number(tax.igst || 0) +
      Number(tax.cess || 0) +
      Number(tax.vat || 0);

    await tax.save();

    res.json({
      success: true,
      message: "Tax Setting updated successfully",
      data: tax,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// ==============================
// Delete Tax Setting
// ==============================
exports.deleteTaxSetting = async (req, res) => {

  try {

    const tax = await TaxSetting.findById(req.params.id);

    if (!tax) {
      return res.status(404).json({
        success: false,
        message: "Tax Setting not found",
      });
    }

    await tax.deleteOne();

    res.json({
      success: true,
      message: "Tax Setting deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};