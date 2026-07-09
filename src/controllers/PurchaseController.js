const Purchase = require("../models/Purchase");

/* ==============================
   Create Purchase
================================ */

exports.createPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.create({
      ...req.body,
      createdBy: req.user?._id || req.user?.id,
    });

    const data = await Purchase.findById(purchase._id)
      .populate("supplier", "supplierName supplierCode")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "variantName skuCode");

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Purchase Number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==============================
   Get All Purchases
================================ */

exports.getPurchases = async (req, res) => {

  try {

    const filter = {
      isDeleted: false,
    };

    if (req.query.store) filter.store = req.query.store;

    if (req.query.supplier) filter.supplier = req.query.supplier;

    if (req.query.paymentStatus)
      filter.paymentStatus = req.query.paymentStatus;

    if (req.query.purchaseStatus)
      filter.purchaseStatus = req.query.purchaseStatus;

    if (req.query.fromDate && req.query.toDate) {
      filter.purchaseDate = {
        $gte: new Date(req.query.fromDate),
        $lte: new Date(req.query.toDate),
      };
    }

    const purchases = await Purchase.find(filter)
      .populate("supplier", "supplierName supplierCode")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName")
      .populate("createdBy", "firstName lastName")
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==============================
   Get Purchase By Id
================================ */

exports.getPurchaseById = async (req, res) => {

  try {

    const purchase = await Purchase.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("supplier")
      .populate("store")
      .populate("warehouse")
      .populate("items.product")
      .populate("items.variant")
      .populate("items.batch")
      .populate("items.unit");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==============================
   Update Purchase
================================ */

exports.updatePurchase = async (req, res) => {

  try {

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase || purchase.isDeleted) {

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });

    }

    Object.assign(purchase, req.body);

    purchase.updatedBy = req.user?._id || req.user?.id;

    await purchase.save();

    res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==============================
   Delete Purchase (Soft Delete)
================================ */

exports.deletePurchase = async (req, res) => {

  try {

    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        updatedBy: req.user?._id || req.user?.id,
      },
      {
        new: true,
      }
    );

    if (!purchase) {

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });

    }

    res.status(200).json({
      success: true,
      message: "Purchase deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==============================
   Today's Purchase
================================ */

exports.getTodayPurchases = async (req, res) => {

  try {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    const purchases = await Purchase.find({
      purchaseDate: {
        $gte: today,
        $lt: tomorrow,
      },
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==============================
   Pending Payment
================================ */

exports.getPendingPurchases = async (req, res) => {

  try {

    const purchases = await Purchase.find({
      paymentStatus: {
        $ne: "paid",
      },
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==============================
   Supplier Purchase
================================ */

exports.getPurchaseBySupplier = async (req, res) => {

  try {

    const purchases = await Purchase.find({
      supplier: req.params.supplierId,
      isDeleted: false,
    }).sort({
      purchaseDate: -1,
    });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};