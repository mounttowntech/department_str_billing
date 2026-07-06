const SalesInvoice = require("../models/SalesInvoice");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

exports.createSalesInvoice = async (req, res) => {
  try {
    const invoice = await SalesInvoice.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    // stock decrease after billing
    for (const item of invoice.items) {
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
      message: "Sales invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesInvoices = async (req, res) => {
  try {
    const { store, customer, paymentStatus, billingType, fromDate, toDate } =
      req.query;

    const filter = {};
    if (store) filter.store = store;
    if (customer) filter.customer = customer;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (billingType) filter.billingType = billingType;

    if (fromDate && toDate) {
      filter.invoiceDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const invoices = await SalesInvoice.find(filter)
      .populate("customer", "customerName phone")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName")
      .populate("coupon", "couponCode discountValue")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "skuCode barcode variantName")
      .populate("items.unit", "unitName shortName")
      .sort({ invoiceDate: -1 });

    res.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesInvoiceById = async (req, res) => {
  try {
    const invoice = await SalesInvoice.findById(req.params.id)
      .populate("customer")
      .populate("store")
      .populate("warehouse")
      .populate("coupon")
      .populate("items.product")
      .populate("items.variant")
      .populate("items.unit")
      .populate("payment");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSalesInvoice = async (req, res) => {
  try {
    const invoice = await SalesInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      });
    }

    res.json({
      success: true,
      message: "Sales invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSalesInvoice = async (req, res) => {
  try {
    const invoice = await SalesInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Sales invoice not found",
      });
    }

    await invoice.deleteOne();

    res.json({
      success: true,
      message: "Sales invoice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};