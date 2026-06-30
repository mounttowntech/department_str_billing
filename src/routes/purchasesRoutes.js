const router = require("express").Router();
const c = require("../controllers/PurchaseController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/", checkPermission("Purchase", "canCreate"), c.createPurchase);
router.get("/", checkPermission("Purchase", "canView"), c.getAllPurchase);
router.get("/:id", checkPermission("Purchase", "canView"), c.getPurchaseById);
router.put("/:id", checkPermission("Purchase", "canEdit"), c.updatePurchase);
router.delete(
  "/:id",
  checkPermission("Purchase", "canDelete"),
  c.deletePurchase,
);
module.exports = router;
