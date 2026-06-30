const router = require("express").Router();
const c = require("../controllers/SalesReturnController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("SalesReturn", "canCreate"),
  c.createSalesReturn,
);
router.get("/", checkPermission("SalesReturn", "canView"), c.getAllSalesReturn);
router.get(
  "/:id",
  checkPermission("SalesReturn", "canView"),
  c.getSalesReturnById,
);
router.put(
  "/:id",
  checkPermission("SalesReturn", "canEdit"),
  c.updateSalesReturn,
);
router.delete(
  "/:id",
  checkPermission("SalesReturn", "canDelete"),
  c.deleteSalesReturn,
);
module.exports = router;
