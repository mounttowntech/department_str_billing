const router = require("express").Router();
const c = require("../controllers/HoldBillController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/", checkPermission("HoldBill", "canCreate"), c.createHoldBill);
router.get("/", checkPermission("HoldBill", "canView"), c.getAllHoldBill);
router.get("/:id", checkPermission("HoldBill", "canView"), c.getHoldBillById);
router.put("/:id", checkPermission("HoldBill", "canEdit"), c.updateHoldBill);
router.delete(
  "/:id",
  checkPermission("HoldBill", "canDelete"),
  c.deleteHoldBill,
);
module.exports = router;
