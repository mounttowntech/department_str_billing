const SalesReturn = require("../models/SalesReturn");
const SalesInvoice = require("../models/SalesInvoice");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

exports.createSalesReturn = async (req, res) => {
  try {
    const salesReturn = await SalesReturn.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    // Stock increase after customer return
    for (const item of salesReturn.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { totalStock: Number(item.quantity || 0) },
      });

      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(item.variant, {
          $inc: { currentStock: Number(item.quantity || 0) },
        });
      }
    }

    await SalesInvoice.findByIdAndUpdate(salesReturn.invoice, {
      returnStatus: "partial",
    });

    res.status(201).json({
      success: true,
      message: "Sales return created successfully",
      data: salesReturn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesReturns = async (req, res) => {
  try {
    const { store, customer, invoice, fromDate, toDate } = req.query;

    const filter = {};
    if (store) filter.store = store;
    if (customer) filter.customer = customer;
    if (invoice) filter.invoice = invoice;

    if (fromDate && toDate) {
      filter.returnDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const returns = await SalesReturn.find(filter)
      .populate("invoice", "invoiceNo grandTotal")
      .populate("customer", "customerName phone")
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

exports.getSalesReturnById = async (req, res) => {
  try {
    const salesReturn = await SalesReturn.findById(req.params.id)
      .populate("invoice")
      .populate("customer")
      .populate("store")
      .populate("warehouse")
      .populate("items.product")
      .populate("items.variant");

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: "Sales return not found",
      });
    }

    res.json({
      success: true,
      data: salesReturn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSalesReturn = async (req, res) => {
  try {
    const salesReturn = await SalesReturn.findById(req.params.id);

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: "Sales return not found",
      });
    }

    await salesReturn.deleteOne();

    res.json({
      success: true,
      message: "Sales return deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};