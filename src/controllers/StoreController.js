const mongoose = require("mongoose");

const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");

// ==========================================================
// CREATE STORE
// ==========================================================

exports.createStore = asyncHandler(async (req, res) => {
  const {
    storeCode,
    storeName,
    ownerName,
    logo,
    email,
    phone,
    alternatePhone,
    gstNumber,
    panNumber,
    fssaiNumber,
    address,
    city,
    state,
    country,
    pincode,
    manager,
    openingTime,
    closingTime,
    currency,
    currencySymbol,
    invoicePrefix,
    purchasePrefix,
    barcodePrefix,
    taxType,
    bankDetails,
    upiDetails,
    printerName,
    thermalPrinterWidth,
    receiptFooter,
    isHeadOffice,
    allowNegativeStock,
    enableBarcode,
    enableLoyalty,
    enableCoupon,
    enableWhatsAppInvoice,
  } = req.body;

  // ========================================================
  // REQUIRED FIELDS
  // ========================================================

  if (
    !storeCode ||
    !storeName ||
    !ownerName ||
    !phone ||
    !address ||
    !city ||
    !state ||
    !pincode
  ) {
    return res.status(400).json({
      success: false,
      message:
        "storeCode, storeName, ownerName, phone, address, city, state and pincode are required.",
    });
  }

  // ========================================================
  // CHECK DUPLICATE STORE CODE
  // ========================================================

  const existingStore = await Store.findOne({
    storeCode: storeCode.trim().toUpperCase(),
  });

  if (existingStore) {
    return res.status(400).json({
      success: false,
      message: "Store code already exists.",
    });
  }

  // ========================================================
  // VALIDATE MANAGER
  // ========================================================

  if (manager) {
    if (!mongoose.Types.ObjectId.isValid(manager)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manager ID.",
      });
    }
  }

  // ========================================================
  // USER
  // ========================================================

  const userId =
    req.user?.id ||
    req.user?._id ||
    req.user?.userId ||
    null;

  // ========================================================
  // CREATE STORE
  // ========================================================

  const store = await Store.create({
    storeCode: storeCode.trim().toUpperCase(),

    storeName: storeName.trim(),

    ownerName: ownerName.trim(),

    logo,

    email: email
      ? email.trim().toLowerCase()
      : undefined,

    phone: phone.trim(),

    alternatePhone,

    gstNumber: gstNumber
      ? gstNumber.trim().toUpperCase()
      : undefined,

    panNumber: panNumber
      ? panNumber.trim().toUpperCase()
      : undefined,

    fssaiNumber,

    address: address.trim(),

    city: city.trim(),

    state: state.trim(),

    country:
      country?.trim() || "India",

    pincode: pincode.trim(),

    manager: manager || undefined,

    openingTime:
      openingTime || "09:00 AM",

    closingTime:
      closingTime || "09:00 PM",

    currency:
      currency || "INR",

    currencySymbol:
      currencySymbol || "₹",

    invoicePrefix:
      invoicePrefix || "INV",

    purchasePrefix:
      purchasePrefix || "PUR",

    barcodePrefix:
      barcodePrefix || "BAR",

    taxType:
      taxType || "GST",

    bankDetails,

    upiDetails,

    printerName,

    thermalPrinterWidth:
      thermalPrinterWidth || 80,

    receiptFooter:
      receiptFooter ||
      "Thank You! Visit Again.",

    isHeadOffice:
      isHeadOffice || false,

    allowNegativeStock:
      allowNegativeStock || false,

    enableBarcode:
      enableBarcode !== undefined
        ? enableBarcode
        : true,

    enableLoyalty:
      enableLoyalty !== undefined
        ? enableLoyalty
        : true,

    enableCoupon:
      enableCoupon !== undefined
        ? enableCoupon
        : true,

    enableWhatsAppInvoice:
      enableWhatsAppInvoice !== undefined
        ? enableWhatsAppInvoice
        : true,

    status: "active",

    createdBy: userId,
  });

  return success(
    res,
    "Store created successfully.",
    store,
    201
  );
});

// ==========================================================
// GET ALL STORES
// ==========================================================

exports.getAllStores = asyncHandler(
  async (req, res) => {
    const {
      search,
      status,
      city,
      state,
      isHeadOffice,
      page = 1,
      limit = 10,
    } = req.query;

    // ========================================================
    // FILTER
    // ========================================================

    const filter = {};

    // ========================================================
    // SEARCH
    // ========================================================

    if (search) {
      filter.$or = [
        {
          storeCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          storeName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          ownerName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ========================================================
    // STATUS
    // ========================================================

    if (status) {
      filter.status = status;
    }

    // ========================================================
    // CITY
    // ========================================================

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    // ========================================================
    // STATE
    // ========================================================

    if (state) {
      filter.state = {
        $regex: state,
        $options: "i",
      };
    }

    // ========================================================
    // HEAD OFFICE
    // ========================================================

    if (isHeadOffice !== undefined) {
      filter.isHeadOffice =
        isHeadOffice === "true";
    }

    // ========================================================
    // PAGINATION
    // ========================================================

    const currentPage =
      Math.max(Number(page), 1);

    const perPage =
      Math.max(Number(limit), 1);

    const skip =
      (currentPage - 1) * perPage;

    // ========================================================
    // QUERY
    // ========================================================

    const [stores, total] =
      await Promise.all([
        Store.find(filter)
          .populate(
            "manager",
            "name email phone"
          )
          .populate(
            "createdBy",
            "name email"
          )
          .populate(
            "updatedBy",
            "name email"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(perPage),

        Store.countDocuments(filter),
      ]);

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Stores fetched successfully.",
      data: stores,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages: Math.ceil(
          total / perPage
        ),
      },
    });
  }
);

// ==========================================================
// GET STORE BY ID
// ==========================================================

exports.getStoreById = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Store ID.",
      });
    }

    // ========================================================
    // FIND STORE
    // ========================================================

    const store = await Store.findById(id)
      .populate(
        "manager",
        "name email phone"
      )
      .populate(
        "createdBy",
        "name email"
      )
      .populate(
        "updatedBy",
        "name email"
      );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    return success(
      res,
      "Store fetched successfully.",
      store
    );
  }
);

// ==========================================================
// UPDATE STORE
// ==========================================================

exports.updateStore = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Store ID.",
      });
    }

    // ========================================================
    // FIND STORE
    // ========================================================

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    // ========================================================
    // USER
    // ========================================================

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId ||
      null;

    // ========================================================
    // STORE CODE
    // ========================================================

    if (req.body.storeCode) {
      const storeCode =
        req.body.storeCode
          .trim()
          .toUpperCase();

      const duplicate =
        await Store.findOne({
          storeCode,
          _id: {
            $ne: id,
          },
        });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message:
            "Store code already exists.",
        });
      }

      store.storeCode = storeCode;
    }

    // ========================================================
    // BASIC INFORMATION
    // ========================================================

    if (req.body.storeName !== undefined)
      store.storeName =
        req.body.storeName.trim();

    if (req.body.ownerName !== undefined)
      store.ownerName =
        req.body.ownerName.trim();

    if (req.body.logo !== undefined)
      store.logo = req.body.logo;

    if (req.body.email !== undefined)
      store.email =
        req.body.email
          ?.trim()
          .toLowerCase();

    if (req.body.phone !== undefined)
      store.phone =
        req.body.phone.trim();

    if (
      req.body.alternatePhone !==
      undefined
    )
      store.alternatePhone =
        req.body.alternatePhone;

    // ========================================================
    // TAX INFORMATION
    // ========================================================

    if (req.body.gstNumber !== undefined)
      store.gstNumber =
        req.body.gstNumber
          ?.trim()
          .toUpperCase();

    if (req.body.panNumber !== undefined)
      store.panNumber =
        req.body.panNumber
          ?.trim()
          .toUpperCase();

    if (req.body.fssaiNumber !== undefined)
      store.fssaiNumber =
        req.body.fssaiNumber;

    // ========================================================
    // ADDRESS
    // ========================================================

    if (req.body.address !== undefined)
      store.address =
        req.body.address.trim();

    if (req.body.city !== undefined)
      store.city =
        req.body.city.trim();

    if (req.body.state !== undefined)
      store.state =
        req.body.state.trim();

    if (req.body.country !== undefined)
      store.country =
        req.body.country.trim();

    if (req.body.pincode !== undefined)
      store.pincode =
        req.body.pincode.trim();

    // ========================================================
    // MANAGER
    // ========================================================

    if (req.body.manager !== undefined) {
      if (
        req.body.manager &&
        !mongoose.Types.ObjectId.isValid(
          req.body.manager
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager ID.",
        });
      }

      store.manager =
        req.body.manager || null;
    }

    // ========================================================
    // BUSINESS SETTINGS
    // ========================================================

    if (req.body.openingTime !== undefined)
      store.openingTime =
        req.body.openingTime;

    if (req.body.closingTime !== undefined)
      store.closingTime =
        req.body.closingTime;

    if (req.body.currency !== undefined)
      store.currency =
        req.body.currency;

    if (
      req.body.currencySymbol !==
      undefined
    )
      store.currencySymbol =
        req.body.currencySymbol;

    if (req.body.invoicePrefix !== undefined)
      store.invoicePrefix =
        req.body.invoicePrefix;

    if (
      req.body.purchasePrefix !==
      undefined
    )
      store.purchasePrefix =
        req.body.purchasePrefix;

    if (
      req.body.barcodePrefix !==
      undefined
    )
      store.barcodePrefix =
        req.body.barcodePrefix;

    if (req.body.taxType !== undefined)
      store.taxType =
        req.body.taxType;

    // ========================================================
    // BANK DETAILS
    // ========================================================

    if (req.body.bankDetails !== undefined) {
      store.bankDetails =
        req.body.bankDetails;
    }

    // ========================================================
    // UPI DETAILS
    // ========================================================

    if (req.body.upiDetails !== undefined) {
      store.upiDetails =
        req.body.upiDetails;
    }

    // ========================================================
    // PRINTER SETTINGS
    // ========================================================

    if (req.body.printerName !== undefined)
      store.printerName =
        req.body.printerName;

    if (
      req.body.thermalPrinterWidth !==
      undefined
    )
      store.thermalPrinterWidth =
        req.body.thermalPrinterWidth;

    if (
      req.body.receiptFooter !==
      undefined
    )
      store.receiptFooter =
        req.body.receiptFooter;

    // ========================================================
    // FEATURES
    // ========================================================

    if (
      req.body.isHeadOffice !==
      undefined
    )
      store.isHeadOffice =
        req.body.isHeadOffice;

    if (
      req.body.allowNegativeStock !==
      undefined
    )
      store.allowNegativeStock =
        req.body.allowNegativeStock;

    if (
      req.body.enableBarcode !==
      undefined
    )
      store.enableBarcode =
        req.body.enableBarcode;

    if (
      req.body.enableLoyalty !==
      undefined
    )
      store.enableLoyalty =
        req.body.enableLoyalty;

    if (
      req.body.enableCoupon !==
      undefined
    )
      store.enableCoupon =
        req.body.enableCoupon;

    if (
      req.body.enableWhatsAppInvoice !==
      undefined
    )
      store.enableWhatsAppInvoice =
        req.body.enableWhatsAppInvoice;

    // ========================================================
    // STATUS
    // ========================================================

    if (req.body.status !== undefined) {
      if (
        !["active", "inactive"].includes(
          req.body.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Status must be active or inactive.",
        });
      }

      store.status =
        req.body.status;
    }

    // ========================================================
    // UPDATED BY
    // ========================================================

    if (userId) {
      store.updatedBy = userId;
    }

    // ========================================================
    // SAVE
    // ========================================================

    await store.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return success(
      res,
      "Store updated successfully.",
      store
    );
  }
);

// ==========================================================
// CHANGE STORE STATUS
// ==========================================================

exports.changeStoreStatus = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Store ID.",
      });
    }

    // ========================================================
    // VALIDATE STATUS
    // ========================================================

    if (
      !["active", "inactive"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be active or inactive.",
      });
    }

    // ========================================================
    // USER
    // ========================================================

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId ||
      null;

    // ========================================================
    // UPDATE STATUS
    // ========================================================

    const store =
      await Store.findByIdAndUpdate(
        id,
        {
          $set: {
            status,
            updatedBy: userId,
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
        }
      );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    return success(
      res,
      `Store ${
        status === "active"
          ? "activated"
          : "deactivated"
      } successfully.`,
      store
    );
  }
);

// ==========================================================
// DELETE STORE - SOFT DELETE
// ==========================================================

exports.deleteStore = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Store ID.",
      });
    }

    // ========================================================
    // USER
    // ========================================================

    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId ||
      null;

    // ========================================================
    // FIND STORE
    // ========================================================

    const store =
      await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    // ========================================================
    // SOFT DELETE
    // ========================================================

    if (store.status === "inactive") {
      return res.status(400).json({
        success: false,
        message:
          "Store is already inactive.",
      });
    }

    // ========================================================
    // UPDATE STATUS
    // ========================================================

    const deletedStore =
      await Store.findByIdAndUpdate(
        id,
        {
          $set: {
            status: "inactive",
            updatedBy: userId,
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
        }
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return success(
      res,
      "Store deleted successfully.",
      deletedStore
    );
  }
);