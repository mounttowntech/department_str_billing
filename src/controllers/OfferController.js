const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");

const Offer = require("../models/Offer");

const Product = require("../models/Product");
const mongoose = require("mongoose");
exports.createOffer = asyncHandler(async (req, res) => {
  const createdBy = req.user?._id || req.body.createdBy;

  if (!createdBy) {
    return res.status(400).json({
      success: false,
      message: "CreatedBy is required",
    });
  }

  const offerData = await Offer.create({
    ...req.body,
    createdBy,
  });

  success(res, "Offer created successfully.", offerData, 201);
});

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

    console.log("Today :", today);

    console.log("Body :", req.body);

    // Get all active offers for the store

    const offers = await Offer.find({
      store: new mongoose.Types.ObjectId(store),

      status: true,
    });

    console.log("Offers Found :", offers.length);

    const applicableOffers = [];

    for (const offer of offers) {
      console.log("--------------------------------");

      console.log("Checking Offer :", offer.offerName);

      // Date Validation

      if (offer.startDate && offer.startDate > today) {
        console.log("Offer not started");

        continue;
      }

      if (offer.endDate && offer.endDate < today) {
        console.log("Offer expired");

        continue;
      }

      let matched = false;

      // Product Match

      if (
        offer.product &&
        productId &&
        offer.product.toString() === productId
      ) {
        matched = true;

        console.log("Matched by Product");
      }

      // Category Match

      if (
        !matched &&
        offer.category &&
        categoryId &&
        offer.category.toString() === categoryId
      ) {
        matched = true;

        console.log("Matched by Category");
      }

      // SubCategory Match

      if (
        !matched &&
        offer.subCategory &&
        subCategoryId &&
        offer.subCategory.toString() === subCategoryId
      ) {
        matched = true;

        console.log("Matched by SubCategory");
      }

      if (!matched) {
        console.log("No Match");

        continue;
      }

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

    // Highest Discount First

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
exports.getAllOffer = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, store } = req.query;

  const filter = {};

  if (store) filter.store = store;

  if (status !== undefined) {
    filter.status = status === "true";
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
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  success(res, "Offer List", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: offers,
  });
});
exports.getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate("product")
    .populate("category")
    .populate("subCategory")
    .populate("store")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found",
    });
  }

  success(res, "Offer Details", offer);
});

exports.updateOffer = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const offer = await Offer.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found",
    });
  }

  success(res, "Offer updated successfully.", offer);
});
exports.deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(
    req.params.id,
    {
      status: false,
      updatedBy: req.user?._id || req.body.updatedBy,
    },
    {
      new: true,
    },
  );

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found",
    });
  }

  success(res, "Offer deactivated successfully.");
});
