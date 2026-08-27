const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/responseHandler");

const SalesInvoice = require("../models/SalesInvoice");
const Purchase = require("../models/Purchase");
const Customer = require("../models/Customer");
const ProductVariant = require("../models/ProductVariant");
const SalesReturn = require("../models/SalesReturn");
const PurchaseReturn = require("../models/PurchaseReturn");
const Expense = require("../models/Expense");

exports.cards = asyncHandler(async (req, res) => {
  const [
    sales,
    purchases,
    customers,
    lowStock,
    salesReturns,
    purchaseReturns,
    expenses,
  ] = await Promise.all([
    SalesInvoice.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          dueAmount: { $sum: "$dueAmount" },
        },
      },
    ]),

    Purchase.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalPurchase: { $sum: "$grandTotal" },
        },
      },
    ]),

    Customer.countDocuments({
      isDeleted: false,
    }),

    ProductVariant.countDocuments({
      isDeleted: false,
      $expr: {
        $lte: ["$currentStock", "$minimumStock"],
      },
    }),

    SalesReturn.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          refund: { $sum: "$refundAmount" },
        },
      },
    ]),

    PurchaseReturn.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          refund: { $sum: "$refundAmount" },
        },
      },
    ]),

    Expense.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const totalSales = sales[0]?.totalSales || 0;
  const totalPurchase = purchases[0]?.totalPurchase || 0;
  const totalExpense = expenses[0]?.totalExpense || 0;

  success(res, "Dashboard Cards", {
    totalSales,
    totalOrders: sales[0]?.totalOrders || 0,
    dueAmount: sales[0]?.dueAmount || 0,

    totalPurchase,

    totalCustomers: customers,

    lowStockItems: lowStock,

    salesReturnAmount: salesReturns[0]?.refund || 0,

    purchaseReturnAmount: purchaseReturns[0]?.refund || 0,

    totalExpense,

    totalProfit:
      totalSales -
      totalPurchase -
      totalExpense,

    averageOrderValue:
      sales[0]?.totalOrders > 0
        ? Number(
            (
              totalSales /
              sales[0].totalOrders
            ).toFixed(2)
          )
        : 0,
  });
});

exports.recent = asyncHandler(async (req, res) => {
  const recentBills = await SalesInvoice.find({
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate(
      "customer",
      "customerName customerCode mobile"
    );

  const recentPurchases = await Purchase.find({
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate(
      "supplier",
      "supplierName supplierCode"
    );

  const lowStock = await ProductVariant.find({
    isDeleted: false,
    $expr: {
      $lte: ["$currentStock", "$minimumStock"],
    },
  })
    .sort({ currentStock: 1 })
    .limit(10)
    .populate(
      "product",
      "productName productCode"
    );

  success(res, "Dashboard Recent Data", {
    recentBills,
    recentPurchases,
    lowStock,
  });
});