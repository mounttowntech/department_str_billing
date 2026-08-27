const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");

const SalesInvoice = require("../models/SalesInvoice");
const Purchase = require("../models/Purchase");

/* ======================================================
   Sales Report
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
    isDeleted: false,
  };

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

  if (search) {
    filter.invoiceNo = {
      $regex: search,
      $options: "i",
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const totalRecords = await SalesInvoice.countDocuments(filter);

  const invoices = await SalesInvoice.find(filter)
    .populate(
      "customer",
      "customerName customerCode phone email"
    )
    .populate(
      "store",
      "storeName storeCode"
    )
    .populate(
      "warehouse",
      "warehouseName warehouseCode"
    )
    .populate(
      "createdBy",
      "firstName lastName"
    )
    .populate(
      "items.product",
      "productName productCode"
    )
    .populate(
      "items.variant",
      "variantName skuCode barcode"
    )
    .sort({
      invoiceDate: -1,
    })
    .skip(skip)
    .limit(Number(limit));

  const totals = await SalesInvoice.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,

        totalSales: {
          $sum: "$grandTotal",
        },

        totalPaid: {
          $sum: "$paidAmount",
        },

        totalDue: {
          $sum: "$dueAmount",
        },

        totalInvoices: {
          $sum: 1,
        },
      },
    },
  ]);

  return success(
    res,
    "Sales report fetched successfully",
    {
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
        totalPages: Math.ceil(
          totalRecords / Number(limit)
        ),
      },

      invoices,
    }
  );
});

/* ======================================================
   Purchase Report
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
    isDeleted: false,
  };

  if (supplier) filter.supplier = supplier;

  if (store) filter.store = store;

  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (fromDate && toDate) {
    filter.purchaseDate = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
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
    .populate(
      "supplier",
      "supplierName supplierCode mobile email"
    )
    .populate(
      "store",
      "storeName storeCode"
    )
    .populate(
      "warehouse",
      "warehouseName warehouseCode"
    )
    .populate(
      "createdBy",
      "firstName lastName"
    )
    .populate(
      "items.product",
      "productName productCode"
    )
    .populate(
      "items.variant",
      "variantName skuCode barcode"
    )
    .sort({
      purchaseDate: -1,
    })
    .skip(skip)
    .limit(Number(limit));

  const totals = await Purchase.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,

        totalPurchase: {
          $sum: "$grandTotal",
        },

        totalPaid: {
          $sum: "$paidAmount",
        },

        totalDue: {
          $sum: "$dueAmount",
        },

        totalPurchases: {
          $sum: 1,
        },
      },
    },
  ]);

  return success(
    res,
    "Purchase report fetched successfully",
    {
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
        totalPages: Math.ceil(
          totalRecords / Number(limit)
        ),
      },

      purchases,
    }
  );
});
/* ======================================================
   Stock Report
====================================================== */

const StockLedger = require("../models/StockLedger");
const Expense = require("../models/Expense");

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

  if (store) filter.store = store;

  if (warehouse) filter.warehouse = warehouse;

  if (product) filter.product = product;

  if (variant) filter.variant = variant;

  if (transactionType) filter.transactionType = transactionType;

  if (fromDate && toDate) {
    filter.createdAt = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  if (search) {
    filter.$or = [
      {
        transactionNo: {
          $regex: search,
          $options: "i",
        },
      },
      {
        remarks: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const totalRecords = await StockLedger.countDocuments(filter);

  const stock = await StockLedger.find(filter)
    .populate(
      "product",
      "productName productCode"
    )
    .populate(
      "variant",
      "variantName skuCode barcode"
    )
    .populate(
      "batch",
      "batchNumber batchCode"
    )
    .populate(
      "store",
      "storeName storeCode"
    )
    .populate(
      "warehouse",
      "warehouseName warehouseCode"
    )
    .populate(
      "createdBy",
      "firstName lastName"
    )
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(Number(limit));

  const summary = await StockLedger.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,

        totalInward: {
          $sum: {
            $cond: [
              { $gt: ["$quantity", 0] },
              "$quantity",
              0,
            ],
          },
        },

        totalOutward: {
          $sum: {
            $cond: [
              { $lt: ["$quantity", 0] },
              {
                $abs: "$quantity",
              },
              0,
            ],
          },
        },

        totalTransactions: {
          $sum: 1,
        },
      },
    },
  ]);

  return success(
    res,
    "Stock report fetched successfully",
    {
      summary: {
        totalInward:
          summary[0]?.totalInward || 0,

        totalOutward:
          summary[0]?.totalOutward || 0,

        totalTransactions:
          summary[0]?.totalTransactions || 0,
      },

      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(
          totalRecords / Number(limit)
        ),
      },

      stock,
    }
  );
});

/* ======================================================
   Expense Report
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

  const filter = {
    isDeleted: false,
  };

  if (store) filter.store = store;

  if (category) filter.category = category;

  if (paymentMethod)
    filter.paymentMethod = paymentMethod;

  if (fromDate && toDate) {
    filter.expenseDate = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    };
  }

  if (search) {
    filter.$or = [
      {
        expenseNo: {
          $regex: search,
          $options: "i",
        },
      },
      {
        expenseName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        remarks: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const totalRecords = await Expense.countDocuments(filter);

  const expenses = await Expense.find(filter)
    .populate(
      "store",
      "storeName storeCode"
    )
    .populate(
      "category",
      "categoryName"
    )
    .populate(
      "createdBy",
      "firstName lastName"
    )
    .sort({
      expenseDate: -1,
    })
    .skip(skip)
    .limit(Number(limit));

  const summary = await Expense.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,

        totalExpense: {
          $sum: "$totalAmount",
        },

        totalRecords: {
          $sum: 1,
        },
      },
    },
  ]);

  return success(
    res,
    "Expense report fetched successfully",
    {
      summary: {
        totalExpense:
          summary[0]?.totalExpense || 0,

        totalRecords:
          summary[0]?.totalRecords || 0,
      },

      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages: Math.ceil(
          totalRecords / Number(limit)
        ),
      },

      expenses,
    }
  );
});

 



exports.profitLoss = asyncHandler(async (req, res) => {

  const { fromDate, toDate, store } = req.query;



  const salesFilter = { isDeleted: false };

  const purchaseFilter = { isDeleted: false };

  const expenseFilter = { isDeleted: false };



  if (store) {

    salesFilter.store = store;

    purchaseFilter.store = store;

    expenseFilter.store = store;

  }



  if (fromDate && toDate) {

    const start = new Date(fromDate);

    const end = new Date(toDate);

    end.setHours(23, 59, 59, 999);



    salesFilter.invoiceDate = {

      $gte: start,

      $lte: end,

    };



    purchaseFilter.purchaseDate = {

      $gte: start,

      $lte: end,

    };



    expenseFilter.expenseDate = {

      $gte: start,

      $lte: end,

    };

  }



  const [sales, purchases, expenses] = await Promise.all([

    SalesInvoice.aggregate([

      { $match: salesFilter },

      {

        $group: {

          _id: null,

          totalSales: { $sum: "$grandTotal" },

        },

      },

    ]),



    Purchase.aggregate([

      { $match: purchaseFilter },

      {

        $group: {

          _id: null,

          totalPurchase: { $sum: "$grandTotal" },

        },

      },

    ]),



    Expense.aggregate([

      { $match: expenseFilter },

      {

        $group: {

          _id: null,

          totalExpense: { $sum: "$totalAmount" },

        },

      },

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