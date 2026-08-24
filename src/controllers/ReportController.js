const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");

const SalesInvoice = require("../models/SalesInvoice");
const Purchase = require("../models/Purchase");
const StockLedger = require("../models/StockLedger");
const Expense = require("../models/Expense");

/* ======================================================
   1. SALES REPORT
====================================================== */
exports.salesReport = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    store,
    customer,
    paymentStatus,
    billingType,
    fromDate,
    toDate,
  } = req.query;

  const filter = {
    isDeleted: { $ne: true },
  };

  if (store) filter.store = new mongoose.Types.ObjectId(store);
  if (customer) filter.customer = new mongoose.Types.ObjectId(customer);
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (billingType) filter.billingType = billingType;

  if (fromDate || toDate) {
    filter.invoiceDate = {};
    if (fromDate) filter.invoiceDate.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.invoiceDate.$lte = end;
    }
  }

  if (search) {
    filter.invoiceNo = {
      $regex: search,
      $options: "i",
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const totalRecords = await SalesInvoice.countDocuments(filter);

  const invoices = await SalesInvoice.find(filter)
    .populate("customer", "customerName customerCode phone email")
    .populate("store", "storeName storeCode address phone")
    .populate("warehouse", "warehouseName warehouseCode")
    .populate("createdBy", "firstName lastName email")
    .populate("items.product", "productName productCode")
    .populate("items.variant", "variantName skuCode barcode")
    .sort({ invoiceDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const totals = await SalesInvoice.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$grandTotal" },
        totalPaid: { $sum: "$paidAmount" },
        totalDue: { $sum: "$dueAmount" },
        totalInvoices: { $sum: 1 },
      },
    },
  ]);

  return success(res, "Sales report fetched successfully", {
    summary: {
      totalSales: totals[0]?.totalSales || 0,
      totalPaid: totals[0]?.totalPaid || 0,
      totalDue: totals[0]?.totalDue || 0,
      totalInvoices: totals[0]?.totalInvoices || 0,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / Number(limit)) || 1,
    },
    invoices,
  });
});

/* ======================================================
   2. PURCHASE REPORT
====================================================== */
exports.purchaseReport = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    supplier,
    store,
    paymentStatus,
    fromDate,
    toDate,
  } = req.query;

  const filter = {
    isDeleted: { $ne: true },
  };

  if (supplier) filter.supplier = new mongoose.Types.ObjectId(supplier);
  if (store) filter.store = new mongoose.Types.ObjectId(store);
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (fromDate || toDate) {
    filter.purchaseDate = {};
    if (fromDate) filter.purchaseDate.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.purchaseDate.$lte = end;
    }
  }

  if (search) {
    filter.purchaseNo = {
      $regex: search,
      $options: "i",
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const totalRecords = await Purchase.countDocuments(filter);

  const purchases = await Purchase.find(filter)
    .populate("supplier", "supplierName supplierCode mobile email")
    .populate("store", "storeName storeCode address phone")
    .populate("warehouse", "warehouseName warehouseCode")
    .populate("createdBy", "firstName lastName email")
    .populate("items.product", "productName productCode")
    .populate("items.variant", "variantName skuCode barcode")
    .sort({ purchaseDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const totals = await Purchase.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalPurchase: { $sum: "$grandTotal" },
        totalPaid: { $sum: "$paidAmount" },
        totalDue: { $sum: "$dueAmount" },
        totalPurchases: { $sum: 1 },
      },
    },
  ]);

  return success(res, "Purchase report fetched successfully", {
    summary: {
      totalPurchase: totals[0]?.totalPurchase || 0,
      totalPaid: totals[0]?.totalPaid || 0,
      totalDue: totals[0]?.totalDue || 0,
      totalPurchases: totals[0]?.totalPurchases || 0,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / Number(limit)) || 1,
    },
    purchases,
  });
});

/* ======================================================
   3. STOCK REPORT
====================================================== */
exports.stockReport = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    store,
    warehouse,
    product,
    variant,
    transactionType,
    fromDate,
    toDate,
  } = req.query;

  const filter = {};

  if (store) filter.store = new mongoose.Types.ObjectId(store);
  if (warehouse) filter.warehouse = new mongoose.Types.ObjectId(warehouse);
  if (product) filter.product = new mongoose.Types.ObjectId(product);
  if (variant) filter.variant = new mongoose.Types.ObjectId(variant);
  if (transactionType) filter.transactionType = transactionType;

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search) {
    filter.$or = [
      { transactionNo: { $regex: search, $options: "i" } },
      { remarks: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const totalRecords = await StockLedger.countDocuments(filter);

  const stock = await StockLedger.find(filter)
    .populate("product", "productName productCode")
    .populate("variant", "variantName skuCode barcode")
    .populate("batch", "batchNumber batchCode")
    .populate("store", "storeName storeCode")
    .populate("warehouse", "warehouseName warehouseCode")
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const summary = await StockLedger.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalInward: {
          $sum: {
            $cond: [{ $gt: ["$quantity", 0] }, "$quantity", 0],
          },
        },
        totalOutward: {
          $sum: {
            $cond: [{ $lt: ["$quantity", 0] }, { $abs: "$quantity" }, 0],
          },
        },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  return success(res, "Stock report fetched successfully", {
    summary: {
      totalInward: summary[0]?.totalInward || 0,
      totalOutward: summary[0]?.totalOutward || 0,
      totalTransactions: summary[0]?.totalTransactions || 0,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / Number(limit)) || 1,
    },
    stock,
  });
});

/* ======================================================
   4. EXPENSE REPORT
====================================================== */
exports.expenseReport = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    store,
    category,
    paymentMethod,
    fromDate,
    toDate,
  } = req.query;

  // Expense model stores active status as boolean true
  const filter = {
    status: true,
  };

  if (store) filter.store = new mongoose.Types.ObjectId(store);
  if (category) filter.expenseCategory = category;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (fromDate || toDate) {
    filter.expenseDate = {};
    if (fromDate) filter.expenseDate.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.expenseDate.$lte = end;
    }
  }

  if (search) {
    filter.$or = [
      { expenseNumber: { $regex: search, $options: "i" } },
      { expenseCategory: { $regex: search, $options: "i" } },
      { receiptNumber: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const totalRecords = await Expense.countDocuments(filter);

  const expenses = await Expense.find(filter)
    .populate("store", "storeName storeCode")
    .populate("supplier", "supplierName supplierCode")
    .populate("createdBy", "firstName lastName email")
    .populate("approvedBy", "firstName lastName email")
    .sort({ expenseDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const summary = await Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalExpense: { $sum: "$totalAmount" },
        totalRecords: { $sum: 1 },
      },
    },
  ]);

  return success(res, "Expense report fetched successfully", {
    summary: {
      totalExpense: summary[0]?.totalExpense || 0,
      totalRecords: summary[0]?.totalRecords || 0,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages: Math.ceil(totalRecords / Number(limit)) || 1,
    },
    expenses,
  });
});

/* ======================================================
   5. PROFIT & LOSS STATEMENT
====================================================== */
exports.profitLoss = asyncHandler(async (req, res) => {
  const { fromDate, toDate, store } = req.query;

  const salesFilter = { isDeleted: { $ne: true } };
  const purchaseFilter = { isDeleted: { $ne: true } };
  const expenseFilter = { status: true };

  if (store) {
    const storeId = new mongoose.Types.ObjectId(store);
    salesFilter.store = storeId;
    purchaseFilter.store = storeId;
    expenseFilter.store = storeId;
  }

  if (fromDate || toDate) {
    const dateRange = {};
    if (fromDate) dateRange.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateRange.$lte = end;
    }

    salesFilter.invoiceDate = dateRange;
    purchaseFilter.purchaseDate = dateRange;
    expenseFilter.expenseDate = dateRange;
  }

  const [sales, purchases, expenses] = await Promise.all([
    SalesInvoice.aggregate([
      { $match: salesFilter },
      { $group: { _id: null, totalSales: { $sum: "$grandTotal" } } },
    ]),
    Purchase.aggregate([
      { $match: purchaseFilter },
      { $group: { _id: null, totalPurchase: { $sum: "$grandTotal" } } },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: null, totalExpense: { $sum: "$totalAmount" } } },
    ]),
  ]);

  const totalSales = sales[0]?.totalSales || 0;
  const totalPurchase = purchases[0]?.totalPurchase || 0;
  const totalExpense = expenses[0]?.totalExpense || 0;

  const grossProfit = totalSales - totalPurchase;
  const netProfit = grossProfit - totalExpense;

  return success(res, "Profit & Loss report fetched successfully", {
    totalSales,
    totalPurchase,
    totalExpense,
    grossProfit,
    netProfit,
  });
});