const router = require("express").Router();
const c = require("../controllers/SalesInvoiceController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("SalesInvoice", "canCreate"),
  c.createSalesInvoice,
);
router.get(
  "/",
  checkPermission("SalesInvoice", "canView"),
  c.getAllSalesInvoice,
);
router.get(
  "/:id",
  checkPermission("SalesInvoice", "canView"),
  c.getSalesInvoiceById,
);
router.put(
  "/:id",
  checkPermission("SalesInvoice", "canEdit"),
  c.updateSalesInvoice,
);
router.delete(
  "/:id",
  checkPermission("SalesInvoice", "canDelete"),
  c.deleteSalesInvoice,
);
module.exports = router;
