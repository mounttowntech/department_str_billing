const response = require('../utils/responseHandler');
const success = response.success;
const asyncHandler = require('../utils/asyncHandler');
const Model = require('../models/Coupon');


exports.createCoupon = asyncHandler(async (req, res) => {
  const createdBy = req.user?._id || req.body.createdBy;

  if (!createdBy) {
    return res.status(400).json({
      success: false,
      message: "CreatedBy is required",
    });
  }

  const coupon = await Model.create({
    ...req.body,
    createdBy,
  });

  success(res, "Coupon created successfully.", coupon, 201);
});

exports.getAllCoupon = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    store,
  } = req.query;

  const filter = {};

  if (store) filter.store = store;

  if (status !== undefined) {
    filter.status = status === "true";
  }

  if (search) {
    filter.couponCode = {
      $regex: search,
      $options: "i",
    };
  }

  const total = await Model.countDocuments(filter);

  const coupons = await Model.find(filter)
    .populate("store", "storeName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  success(res, "Coupon List", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: coupons,
  });
});
exports.getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Model.findById(req.params.id)
    .populate("store")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  success(res, "Coupon Details", coupon);
});
exports.updateCoupon = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const coupon = await Model.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  success(res, "Coupon updated successfully.", coupon);
});
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Model.findByIdAndUpdate(
    req.params.id,
    {
      status: false,
      updatedBy: req.user?._id || req.body.updatedBy,
    },
    {
      new: true,
    }
  );

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  success(res, "Coupon deactivated successfully.");
});