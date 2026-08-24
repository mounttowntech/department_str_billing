const express = require("express");
const cors = require("cors");
const path = require("path");
const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Billing API running" });
});

app.use("/api/audit-logs", require("./src/routes/auditlogsRoutes"));
app.use("/api/barcodes", require("./src/routes/barcodesRoutes"));
app.use("/api/batchs", require("./src/routes/batchsRoutes"));
app.use("/api/brands", require("./src/routes/brandsRoutes"));
app.use("/api/cash-sessions", require("./src/routes/cash-sessionsRoutes"));
app.use("/api/coupons", require("./src/routes/couponsRoutes"));
app.use("/api/customer-addresss", require("./src/routes/customer-addresssRoutes"));
app.use("/api/customers", require("./src/routes/customersRoutes"));
app.use("/api/dashboard", require("./src/routes/dashboardRoutes"));
app.use("/api/department-categories", require("./src/routes/department-categorysRoutes"));
app.use("/api/department-sub-categories", require("./src/routes/department-sub-categorysRoutes"));
app.use("/api/expenses", require("./src/routes/expensesRoutes"));
app.use("/api/hold-bills", require("./src/routes/hold-billsRoutes"));
app.use("/api/loyalty-points", require("./src/routes/loyalty-pointssRoutes"));
app.use("/api/notifications", require("./src/routes/notificationsRoutes"));
app.use("/api/offers", require("./src/routes/offersRoutes"));
app.use("/api/payments", require("./src/routes/paymentsRoutes"));
app.use("/api/product-variants", require("./src/routes/product-variantsRoutes"));
app.use("/api/products", require("./src/routes/productsRoutes"));
app.use("/api/purchase-returns", require("./src/routes/purchase-returnsRoutes"));
app.use("/api/purchases", require("./src/routes/purchasesRoutes"));
app.use("/api/report", require("./src/routes/reportRoutes"));
app.use("/api/role-permissions", require("./src/routes/role-permissionsRoutes"));
app.use("/api/sales-invoices", require("./src/routes/sales-invoicesRoutes"));
app.use("/api/sales-returns", require("./src/routes/sales-returnsRoutes"));
app.use("/api/settings", require("./src/routes/settingssRoutes"));
app.use("/api/shelfs", require("./src/routes/shelfsRoutes"));
app.use("/api/stock-adjustments", require("./src/routes/stock-adjustmentsRoutes"));
app.use("/api/stock-ledgers", require("./src/routes/stock-ledgersRoutes"));
app.use("/api/stock-transfers", require("./src/routes/stock-transfersRoutes"));
app.use("/api/stores", require("./src/routes/storesRoutes"));
app.use("/api/suppliers", require("./src/routes/suppliersRoutes"));
app.use("/api/tax-settings", require("./src/routes/tax-settingsRoutes"));
app.use("/api/units", require("./src/routes/unitsRoutes"));
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users",require("./src/routes/userRoutes"));
app.use("/api/warehouses", require("./src/routes/warehousesRoutes"));
app.use("/uploads", express.static("uploads"));// Inline Profile Route (No separate file needed)
const profileRouter = require("express").Router();
profileRouter.get("/", (req, res) => res.json({ success: true, data: req.user || null }));
profileRouter.put("/update", (req, res) => res.json({ success: true, message: "Profile updated", data: req.body }));
profileRouter.put("/change-password", (req, res) => res.json({ success: true, message: "Password updated" }));
app.use("/api/profile", profileRouter);
// app.use(errorMiddleware);

module.exports = app;
