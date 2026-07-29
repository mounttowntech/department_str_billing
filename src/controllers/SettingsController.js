const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");

const Settings = require("../models/Settings");

/*
|--------------------------------------------------------------------------
| Create Settings
|--------------------------------------------------------------------------
*/
exports.createSettings = asyncHandler(async (req, res) => {
  const createdBy = req.user?._id || req.body.createdBy;

  // One settings per store
  const existing = await Settings.findOne({
    store: req.body.store,
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Settings already exist for this store.",
    });
  }

  const settings = await Settings.create({
    ...req.body,
    createdBy,
  });

  success(res, "Settings created successfully.", settings, 201);
});

/*
|--------------------------------------------------------------------------
| Get All Settings
|--------------------------------------------------------------------------
*/
exports.getAllSettings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, store, status } = req.query;

  const filter = {};

  if (store) {
    filter.store = store;
  }

  if (status !== undefined) {
    filter.status = status === "true";
  }

  if (search) {
    filter.$or = [
      {
        invoicePrefix: {
          $regex: search,
          $options: "i",
        },
      },
      {
        purchasePrefix: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const total = await Settings.countDocuments(filter);

  const settings = await Settings.find(filter)
    .populate("store", "storeName storeCode")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  success(res, "Settings List", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: settings,
  });
});

/*
|--------------------------------------------------------------------------
| Get Settings By ID
|--------------------------------------------------------------------------
*/
exports.getSettingsById = asyncHandler(async (req, res) => {
  const settings = await Settings.findById(req.params.id)
    .populate("store")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!settings) {
    return res.status(404).json({
      success: false,
      message: "Settings not found.",
    });
  }

  success(res, "Settings Details", settings);
});

/*
|--------------------------------------------------------------------------
| Get Settings By Store
|--------------------------------------------------------------------------
*/
exports.getSettingsByStore = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne({
    store: req.params.storeId,
    status: true,
  })
    .populate("store")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!settings) {
    return res.status(404).json({
      success: false,
      message: "Settings not found for this store.",
    });
  }

  success(res, "Store Settings", settings);
});

/*
|--------------------------------------------------------------------------
| Update Settings
|--------------------------------------------------------------------------
*/
exports.updateSettings = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const settings = await Settings.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("store", "storeName storeCode")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!settings) {
    return res.status(404).json({
      success: false,
      message: "Settings not found.",
    });
  }

  success(res, "Settings updated successfully.", settings);
});

/*
|--------------------------------------------------------------------------
| Delete Settings (Soft Delete)
|--------------------------------------------------------------------------
*/
exports.deleteSettings = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const settings = await Settings.findByIdAndUpdate(
    req.params.id,
    {
      status: false,
      updatedBy,
    },
    {
      new: true,
    },
  );

  if (!settings) {
    return res.status(404).json({
      success: false,
      message: "Settings not found.",
    });
  }

  success(res, "Settings deleted successfully.");
});
