const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

exports.createPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    // stock increase
    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { totalStock: item.quantity },
      });

      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant, {
          $inc: { currentStock: item.quantity },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const { store, supplier, paymentStatus, fromDate, toDate } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (supplier) filter.supplier = supplier;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (fromDate && toDate) {
      filter.purchaseDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const purchases = await Purchase.find(filter)
      .populate("supplier", "supplierName mobile companyName")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "skuCode barcode variantName")
      .populate("items.unit", "unitName shortName")
      .sort({ purchaseDate: -1 });

    res.json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("supplier")
      .populate("store")
      .populate("warehouse")
      .populate("items.product")
      .populate("items.variant")
      .populate("items.unit");

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    await purchase.deleteOne();

    res.json({
      success: true,
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};