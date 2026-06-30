const router = require("express").Router();
const c = require("../controllers/PurchaseReturnController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("PurchaseReturn", "canCreate"),
  c.createPurchaseReturn,
);
router.get(
  "/",
  checkPermission("PurchaseReturn", "canView"),
  c.getAllPurchaseReturn,
);
router.get(
  "/:id",
  checkPermission("PurchaseReturn", "canView"),
  c.getPurchaseReturnById,
);
router.put(
  "/:id",
  checkPermission("PurchaseReturn", "canEdit"),
  c.updatePurchaseReturn,
);
router.delete(
  "/:id",
  checkPermission("PurchaseReturn", "canDelete"),
  c.deletePurchaseReturn,
);
module.exports = router;
