const SalesInvoice = require("../models/SalesInvoice");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");

exports.getDashboardOverview = async (req, res) => {
  try {
    // ================================
    // BASIC COUNTS
    // ================================

    const [
      totalProducts,
      totalCustomers,
      totalStores,
      totalWarehouses,
      totalInvoices,
    ] = await Promise.all([
      Product.countDocuments(),
      Customer.countDocuments({ status: "active" }),
      Store.countDocuments(),
      Warehouse.countDocuments(),
      SalesInvoice.countDocuments({ isDeleted: false }),
    ]);

    // ================================
    // SALES TOTAL
    // ================================

    const salesResult = await SalesInvoice.aggregate([
      {
        $match: {
          isDeleted: false,
        },
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
        },
      },
    ]);

    const sales = salesResult[0] || {
      totalSales: 0,
      totalPaid: 0,
      totalDue: 0,
    };

    // ================================
    // TODAY SALES
    // ================================

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayResult = await SalesInvoice.aggregate([
      {
        $match: {
          isDeleted: false,
          invoiceDate: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        },
      },
      {
        $group: {
          _id: null,
          sales: {
            $sum: "$grandTotal",
          },
          invoices: {
            $sum: 1,
          },
        },
      },
    ]);

    const today = todayResult[0] || {
      sales: 0,
      invoices: 0,
    };

    // ================================
    // PAYMENT STATUS
    // ================================

    const paymentStatusResult = await SalesInvoice.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          count: {
            $sum: 1,
          },
          amount: {
            $sum: "$grandTotal",
          },
        },
      },
    ]);

    const paymentStatus = paymentStatusResult.map((item) => ({
      status: item._id,
      count: item.count,
      amount: item.amount,
    }));

    // ================================
    // RECENT INVOICES
    // ================================

    const recentInvoices = await SalesInvoice.find({
      isDeleted: false,
    })
      .populate("customer", "customerName customerCode")
      .populate("store", "storeName storeCode")
      .sort({
        invoiceDate: -1,
        createdAt: -1,
      })
      .limit(5)
      .lean();

    // ================================
    // LOW STOCK PRODUCTS
    // ================================

    const lowStockProducts = await Product.find({
      totalStock: {
        $lte: 10,
      },
    })
      .select("productName productCode totalStock")
      .sort({
        totalStock: 1,
      })
      .limit(5)
      .lean();

    // ================================
    // MONTHLY SALES
    // ================================

    const currentYear = new Date().getFullYear();

    const monthlySales = await SalesInvoice.aggregate([
      {
        $match: {
          isDeleted: false,
          invoiceDate: {
            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
            $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$invoiceDate",
            },
          },
          sales: {
            $sum: "$grandTotal",
          },
          invoices: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    const monthlySalesFormatted = monthlySales.map((item) => ({
      month: item._id.month,
      sales: item.sales,
      invoices: item.invoices,
    }));

    // ================================
    // RESPONSE
    // ================================

    return res.status(200).json({
      success: true,

      data: {
        summary: {
          totalSales: Number(sales.totalSales || 0),
          totalPaid: Number(sales.totalPaid || 0),
          totalDue: Number(sales.totalDue || 0),

          totalProducts,
          totalCustomers,
          totalStores,
          totalWarehouses,
          totalInvoices,

          todaySales: Number(today.sales || 0),
          todayInvoices: Number(today.invoices || 0),
        },

        paymentStatus,

        recentInvoices,

        lowStockProducts,

        monthlySales: monthlySalesFormatted,
      },
    });
  } catch (error) {
    console.error("Dashboard Overview Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};