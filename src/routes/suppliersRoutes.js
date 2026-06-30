const router = require("express").Router();
const c = require("../controllers/SupplierController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/", checkPermission("Supplier", "canCreate"), c.createSupplier);
router.get("/", checkPermission("Supplier", "canView"), c.getAllSupplier);
router.get("/:id", checkPermission("Supplier", "canView"), c.getSupplierById);
router.put("/:id", checkPermission("Supplier", "canEdit"), c.updateSupplier);
router.delete(
  "/:id",
  checkPermission("Supplier", "canDelete"),
  c.deleteSupplier,
);
module.exports = router;
