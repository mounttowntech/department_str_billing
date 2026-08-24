const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");
const Coupon = require("../models/Coupon");

/* ============================================================
   1. CREATE COUPON
============================================================ */
exports.createCoupon = asyncHandler(async (req, res) => {
  const createdBy =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.createdBy;

  if (!createdBy) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found. Please log in again.",
    });
  }

  const { couponCode } = req.body;
  if (!couponCode) {
    return res.status(400).json({
      success: false,
      message: "Coupon code is required.",
    });
  }

  const existing = await Coupon.findOne({
    couponCode: couponCode.trim().toUpperCase(),
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Coupon code already exists.",
    });
  }

  const coupon = await Coupon.create({
    ...req.body,
    couponCode: couponCode.trim().toUpperCase(),
    createdBy,
  });

  return success(res, "Coupon created successfully.", coupon, 201);
});

/* ============================================================
   2. GET ALL COUPONS
============================================================ */
exports.getAllCoupon = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, search, status, store } = req.query;

  const filter = {};

  if (store) filter.store = store;

  if (status !== undefined && status !== "") {
    filter.status = status === "true" || status === true;
  }

  if (search) {
    filter.couponCode = {
      $regex: search,
      $options: "i",
    };
  }

  const total = await Coupon.countDocuments(filter);

  const coupons = await Coupon.find(filter)
    .populate("store", "storeName storeCode")
    .populate("createdBy", "firstName lastName name email")
    .populate("updatedBy", "firstName lastName name email")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return success(res, "Coupon List", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
    data: coupons,
  });
});

/* ============================================================
   3. GET COUPON BY ID
============================================================ */
exports.getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate("store")
    .populate("createdBy", "firstName lastName name email")
    .populate("updatedBy", "firstName lastName name email");

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  return success(res, "Coupon Details", coupon);
});

/* ============================================================
   4. UPDATE COUPON
============================================================ */
exports.updateCoupon = asyncHandler(async (req, res) => {
  const updatedBy =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.updatedBy;

  if (req.body.couponCode) {
    req.body.couponCode = req.body.couponCode.trim().toUpperCase();
  }

  const coupon = await Coupon.findByIdAndUpdate(
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

  return success(res, "Coupon updated successfully.", coupon);
});

/* ============================================================
   5. TOGGLE STATUS (ACTIVE <-> INACTIVE)
============================================================ */
exports.toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  const updatedBy =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.updatedBy;

  coupon.status = !coupon.status;
  coupon.updatedBy = updatedBy;
  await coupon.save();

  return success(
    res,
    `Coupon ${coupon.status ? "activated" : "deactivated"} successfully.`,
    coupon
  );
});

/* ============================================================
   6. PERMANENT DELETE
============================================================ */
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  return success(res, "Coupon deleted permanently.");
});