const router = require("express").Router();
const c = require("../controllers/WarehouseController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/", checkPermission("Warehouse", "canCreate"), c.createWarehouse);
router.get("/", checkPermission("Warehouse", "canView"), c.getAllWarehouse);
router.get("/:id", checkPermission("Warehouse", "canView"), c.getWarehouseById);
router.put("/:id", checkPermission("Warehouse", "canEdit"), c.updateWarehouse);
router.delete(
  "/:id",
  checkPermission("Warehouse", "canDelete"),
  c.deleteWarehouse,
);
module.exports = router;
