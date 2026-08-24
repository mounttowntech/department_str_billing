const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");
const Offer = require("../models/Offer");
const Product = require("../models/Product");
const mongoose = require("mongoose");

/* ============================================================
   1. CREATE OFFER
============================================================ */
exports.createOffer = asyncHandler(async (req, res) => {
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

  const offerData = await Offer.create({
    ...req.body,
    createdBy,
  });

  return success(res, "Offer created successfully.", offerData, 201);
});

/* ============================================================
   2. CHECK APPLICABLE OFFER
============================================================ */
exports.getApplicableOffer = asyncHandler(async (req, res) => {
  try {
    const {
      store,
      productId,
      categoryId,
      subCategoryId,
      billAmount,
    } = req.body;

    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Store is required.",
      });
    }

    if (!billAmount || Number(billAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid bill amount is required.",
      });
    }

    const today = new Date();
    const offers = await Offer.find({
      store: new mongoose.Types.ObjectId(store),
      status: true,
    });

    const applicableOffers = [];

    for (const offer of offers) {
      if (offer.startDate && new Date(offer.startDate) > today) continue;
      if (offer.endDate && new Date(offer.endDate) < today) continue;

      let matched = false;

      // Product Match
      if (
        offer.product &&
        productId &&
        offer.product.toString() === productId
      ) {
        matched = true;
      }

      // Category Match
      if (
        !matched &&
        offer.category &&
        categoryId &&
        offer.category.toString() === categoryId
      ) {
        matched = true;
      }

      // SubCategory Match
      if (
        !matched &&
        offer.subCategory &&
        subCategoryId &&
        offer.subCategory.toString() === subCategoryId
      ) {
        matched = true;
      }

      // Store-wide fallback
      if (!matched && !offer.product && !offer.category && !offer.subCategory) {
        matched = true;
      }

      if (!matched) continue;

      let discount = 0;
      if (offer.discountType === "percentage") {
        discount = (Number(billAmount) * offer.discountValue) / 100;
      } else {
        discount = offer.discountValue;
      }

      applicableOffers.push({
        offerId: offer._id,
        offerName: offer.offerName,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discount: Number(discount.toFixed(2)),
        finalAmount: Number((billAmount - discount).toFixed(2)),
      });
    }

    if (applicableOffers.length === 0) {
      return res.json({
        success: true,
        offerAvailable: false,
        message: "No applicable offer found.",
      });
    }

    applicableOffers.sort((a, b) => b.discount - a.discount);

    return res.json({
      success: true,
      offerAvailable: true,
      bestOffer: applicableOffers[0],
      allOffers: applicableOffers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ============================================================
   3. GET ALL OFFERS
============================================================ */
exports.getAllOffer = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, search, status, store } = req.query;

  const filter = {};

  if (store) filter.store = store;

  if (status !== undefined && status !== "") {
    filter.status = status === "true" || status === true;
  }

  if (search) {
    filter.offerName = {
      $regex: search,
      $options: "i",
    };
  }

  const total = await Offer.countDocuments(filter);

  const offers = await Offer.find(filter)
    .populate("product", "productName")
    .populate("category", "categoryName")
    .populate("subCategory", "subCategoryName")
    .populate("store", "storeName")
    .populate("createdBy", "firstName lastName name email")
    .populate("updatedBy", "firstName lastName name email")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return success(res, "Offer List", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
    data: offers,
  });
});

/* ============================================================
   4. GET OFFER BY ID
============================================================ */
exports.getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate("product")
    .populate("category")
    .populate("subCategory")
    .populate("store")
    .populate("createdBy", "firstName lastName name email")
    .populate("updatedBy", "firstName lastName name email");

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found",
    });
  }

  return success(res, "Offer Details", offer);
});

/* ============================================================
   5. UPDATE OFFER
============================================================ */
exports.updateOffer = asyncHandler(async (req, res) => {
  const updatedBy =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.updatedBy;

  const offer = await Offer.findByIdAndUpdate(
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

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found",
    });
  }

  return success(res, "Offer updated successfully.", offer);
});

/* ============================================================
   6. TOGGLE STATUS (ACTIVE <-> INACTIVE)
============================================================ */
exports.toggleOfferStatus = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found",
    });
  }

  const updatedBy =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.updatedBy;

  offer.status = !offer.status;
  offer.updatedBy = updatedBy;
  await offer.save();

  return success(
    res,
    `Offer ${offer.status ? "activated" : "deactivated"} successfully.`,
    offer
  );
});

/* ============================================================
   7. DELETE PERMANENTLY
============================================================ */
exports.deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found",
    });
  }

  return success(res, "Offer deleted permanently.");
});