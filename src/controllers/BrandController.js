const Brand = require("../models/Brand");
const fs = require("fs");
const path = require("path");

// Helper: delete a logo file from disk when replaced, removed, or the brand is deleted
const removeLogoFile = (logoPath) => {
  if (!logoPath) return;
  const fullPath = path.join(__dirname, "..", logoPath.replace(/^\/+/, ""));
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to remove logo file:", err.message);
    }
  });
};

exports.createBrand = async (req, res) => {
  try {
    const payload = { ...req.body, createdBy: req.user?.id };

    // existingLogo is a frontend-only field (used on edit), never store it
    delete payload.existingLogo;

    if (req.file) {
      payload.logo = `/uploads/brands/${req.file.filename}`;
    }

    const brand = await Brand.create(payload);

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Brand code or brand name already exists in this store",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllBrands = async (req, res) => {
  try {
    const { store, status, industryType, showOnPOS, search } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (status) filter.status = status;
    if (industryType) filter.industryType = industryType;

    if (showOnPOS !== undefined) {
      filter.showOnPOS = showOnPOS === "true";
    }

    if (search) {
      filter.$or = [
        { brandCode: { $regex: search, $options: "i" } },
        { brandName: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
      ];
    }

    const brands = await Brand.find(filter)
      .populate("store", "storeName storeCode")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.json({
      success: true,
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const existing = await Brand.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const payload = { ...req.body, updatedBy: req.user?.id };
    const existingLogoSentByClient = payload.existingLogo;
    delete payload.existingLogo; // not a schema field, just a signal

    if (req.file) {
      // A new logo was chosen — swap it and delete the old file
      payload.logo = `/uploads/brands/${req.file.filename}`;
      removeLogoFile(existing.logo);
    } else if (existingLogoSentByClient === "") {
      // User explicitly removed the logo without picking a new one
      payload.logo = "";
      removeLogoFile(existing.logo);
    } else {
      // No new file, logo not removed — leave the current logo untouched
      delete payload.logo;
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Brand code or brand name already exists in this store",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Flips active <-> inactive in a single call (mounted at /activate/:id
// to match the Category module's convention, even though it toggles both ways)
exports.toggleBrandStatus = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    brand.status = brand.status === "active" ? "inactive" : "active";
    brand.updatedBy = req.user?.id;
    await brand.save();

    res.json({
      success: true,
      message: `Brand ${brand.status === "active" ? "activated" : "deactivated"} successfully`,
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Permanent delete — removes the document and its logo file from disk
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    removeLogoFile(brand.logo);

    res.json({
      success: true,
      message: "Brand permanently deleted",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};