const User = require("../models/User");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const SalesInvoice = require("../models/SalesInvoice");
const Purchase = require("../models/Purchase");

exports.getDashboardOverview = async (req, res) => {
  try {
    // =========================================================
    // 1. GET LOGGED-IN USER
    // =========================================================

    const user = await User.findById(req.user.id)
      .select("-password")
      .populate(
        "role",
        "roleCode roleName dashboardAccess permissions status"
      )
      .populate("store", "storeName storeCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================================================
    // 2. CHECK ROLE
    // =========================================================

    if (!user.role) {
      return res.status(403).json({
        success: false,
        message: "User role not found",
      });
    }

    if (user.role.status?.toLowerCase() !== "active") {
      console.log("DASHBOARD DEBUG: Role inactive:", {
        roleCode: user.role.roleCode,
        status: user.role.status,
      });

      return res.status(403).json({
        success: false,
        message: "User role is inactive",
      });
    }

    // =========================================================
    // 3. CHECK DASHBOARD ACCESS
    // =========================================================

    if (!user.role.dashboardAccess) {
      console.log(
        "DASHBOARD DEBUG: Dashboard access denied:",
        user.role.roleCode
      );

      return res.status(403).json({
        success: false,
        message: "Dashboard access denied",
      });
    }

    const roleCode = user.role.roleCode;

    // =========================================================
    // 4. STORE FILTER
    // =========================================================

    const storeFilter = {};

    if (user.store?._id) {
      storeFilter.store = user.store._id;
    }

    // =========================================================
    // 5. COMMON RESPONSE
    // =========================================================

    const response = {
      success: true,

      user: {
        id: user._id,

        firstName: user.firstName,

        lastName: user.lastName,

        email: user.email,

        role: {
          id: user.role._id,
          roleCode: user.role.roleCode,
          roleName: user.role.roleName,
        },

        store: user.store
          ? {
              id: user.store._id,
              storeName: user.store.storeName,
              storeCode: user.store.storeCode,
            }
          : null,
      },

      role: roleCode,

      data: {},
    };

    // =========================================================
    // 6. ADMIN DASHBOARD
    // =========================================================

    if (roleCode === "ADMIN") {
      const [
        totalProducts,
        totalCustomers,
        totalInvoices,
        totalPurchases,
        lowStockProducts,
        recentInvoices,
      ] = await Promise.all([
        // Total products
        Product.countDocuments(storeFilter),

        // Active customers
        Customer.countDocuments({
          ...storeFilter,
          status: "active",
        }),

        // Total sales invoices
        SalesInvoice.countDocuments({
          ...storeFilter,
          isDeleted: false,
        }),

        // Total purchases
        Purchase.countDocuments({
          ...storeFilter,
          isDeleted: false,
        }),

        // Low stock products
        Product.find({
          ...storeFilter,
          status: "active",

          $expr: {
            $lte: ["$totalStock", "$minimumStock"],
          },
        })
          .select(
            "productName productCode totalStock minimumStock"
          )
          .sort({
            totalStock: 1,
          })
          .limit(10),

        // Recent invoices
        SalesInvoice.find({
          ...storeFilter,
          isDeleted: false,
        })
          .populate("customer", "customerName")
          .sort({
            createdAt: -1,
          })
          .limit(10),
      ]);

      response.data = {
        cards: {
          totalProducts,
          totalCustomers,
          totalInvoices,
          totalPurchases,
        },

        lowStockProducts,

        recentInvoices,
      };

      return res.status(200).json(response);
    }

    // =========================================================
    // 7. MANAGER DASHBOARD
    // =========================================================

    if (roleCode === "MANAGER") {
      const [
        totalProducts,
        totalCustomers,
        totalInvoices,
        totalPurchases,
        lowStockProducts,
        recentInvoices,
      ] = await Promise.all([
        // Total products
        Product.countDocuments(storeFilter),

        // Active customers
        Customer.countDocuments({
          ...storeFilter,
          status: "active",
        }),

        // Total invoices
        SalesInvoice.countDocuments({
          ...storeFilter,
          isDeleted: false,
        }),

        // Total purchases
        Purchase.countDocuments({
          ...storeFilter,
          isDeleted: false,
        }),

        // Low stock products
        Product.find({
          ...storeFilter,
          status: "active",

          $expr: {
            $lte: ["$totalStock", "$minimumStock"],
          },
        })
          .select(
            "productName productCode totalStock minimumStock"
          )
          .sort({
            totalStock: 1,
          })
          .limit(10),

        // Recent invoices
        SalesInvoice.find({
          ...storeFilter,
          isDeleted: false,
        })
          .populate("customer", "customerName")
          .sort({
            createdAt: -1,
          })
          .limit(10),
      ]);

      response.data = {
        cards: {
          totalProducts,
          totalCustomers,
          totalInvoices,
          totalPurchases,
        },

        lowStockProducts,

        recentInvoices,
      };

      return res.status(200).json(response);
    }

    // =========================================================
    // 8. CASHIER DASHBOARD
    // =========================================================

    if (roleCode === "CASHIER") {
      // Start of today
      const startOfToday = new Date();

      startOfToday.setHours(0, 0, 0, 0);

      // Start of tomorrow
      const startOfTomorrow = new Date(startOfToday);

      startOfTomorrow.setDate(
        startOfTomorrow.getDate() + 1
      );

      const [
        todayInvoices,
        todaySales,
        pendingPayments,
        recentInvoices,
      ] = await Promise.all([
        // Today's invoices
        SalesInvoice.countDocuments({
          ...storeFilter,

          isDeleted: false,

          invoiceDate: {
            $gte: startOfToday,
            $lt: startOfTomorrow,
          },
        }),

        // Today's sales
        SalesInvoice.aggregate([
          {
            $match: {
              ...storeFilter,

              isDeleted: false,

              invoiceDate: {
                $gte: startOfToday,
                $lt: startOfTomorrow,
              },
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: "$grandTotal",
              },
            },
          },
        ]),

        // Pending / Partial payments
        SalesInvoice.countDocuments({
          ...storeFilter,

          isDeleted: false,

          paymentStatus: {
            $in: ["Pending", "Partial"],
          },
        }),

        // Recent invoices
        SalesInvoice.find({
          ...storeFilter,

          isDeleted: false,
        })
          .populate("customer", "customerName")
          .sort({
            createdAt: -1,
          })
          .limit(10),
      ]);

      response.data = {
        cards: {
          todayInvoices,

          todaySales:
            todaySales.length > 0
              ? todaySales[0].total
              : 0,

          pendingPayments,
        },

        recentInvoices,
      };

      return res.status(200).json(response);
    }

    // =========================================================
    // 9. SALES EXECUTIVE DASHBOARD
    // =========================================================

    if (roleCode === "SALES_EXECUTIVE") {
      const [
        totalCustomers,
        totalInvoices,
        totalSales,
        recentInvoices,
      ] = await Promise.all([
        // Active customers
        Customer.countDocuments({
          ...storeFilter,

          status: "active",
        }),

        // Total invoices
        SalesInvoice.countDocuments({
          ...storeFilter,

          isDeleted: false,
        }),

        // Total sales
        SalesInvoice.aggregate([
          {
            $match: {
              ...storeFilter,

              isDeleted: false,
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: "$grandTotal",
              },
            },
          },
        ]),

        // Recent invoices
        SalesInvoice.find({
          ...storeFilter,

          isDeleted: false,
        })
          .populate("customer", "customerName")
          .sort({
            createdAt: -1,
          })
          .limit(10),
      ]);

      response.data = {
        cards: {
          totalCustomers,

          totalInvoices,

          totalSales:
            totalSales.length > 0
              ? totalSales[0].total
              : 0,
        },

        recentInvoices,
      };

      return res.status(200).json(response);
    }

    // =========================================================
    // 10. UNKNOWN ROLE
    // =========================================================

    return res.status(403).json({
      success: false,

      message: `Dashboard not configured for role: ${roleCode}`,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};