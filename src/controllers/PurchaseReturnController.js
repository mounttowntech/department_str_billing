const PurchaseReturn = require("../models/PurchaseReturn");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

exports.createPurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    // stock decrease after returning items to supplier
    for (const item of purchaseReturn.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { totalStock: -Number(item.quantity || 0) },
      });

      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant, {
          $inc: { currentStock: -Number(item.quantity || 0) },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Purchase return created successfully",
      data: purchaseReturn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseReturns = async (req, res) => {
  try {
    const { store, supplier, purchase, fromDate, toDate } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (supplier) filter.supplier = supplier;
    if (purchase) filter.purchase = purchase;

    if (fromDate && toDate) {
      filter.returnDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const returns = await PurchaseReturn.find(filter)
      .populate("purchase", "purchaseNo grandTotal")
      .populate("supplier", "supplierName mobile companyName")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "skuCode barcode variantName")
      .sort({ returnDate: -1 });

    res.json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchaseReturnById = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id)
      .populate("purchase")
      .populate("supplier")
      .populate("store")
      .populate("warehouse")
      .populate("items.product")
      .populate("items.variant");

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    res.json({
      success: true,
      data: purchaseReturn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePurchaseReturn = async (req, res) => {
  try {
    const purchaseReturn = await PurchaseReturn.findById(req.params.id);

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    await purchaseReturn.deleteOne();

    res.json({
      success: true,
      message: "Purchase return deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};