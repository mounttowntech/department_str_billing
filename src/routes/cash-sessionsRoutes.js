const router = require("express").Router();
const c = require("../controllers/CashSessionController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("CashSession", "canCreate"),
  c.createCashSession,
);
router.get("/", checkPermission("CashSession", "canView"), c.getAllCashSession);
router.get(
  "/:id",
  checkPermission("CashSession", "canView"),
  c.getCashSessionById,
);
router.put(
  "/:id",
  checkPermission("CashSession", "canEdit"),
  c.updateCashSession,
);
router.delete(
  "/:id",
  checkPermission("CashSession", "canDelete"),
  c.deleteCashSession,
);
module.exports = router;
