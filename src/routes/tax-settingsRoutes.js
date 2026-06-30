const router = require("express").Router();
const c = require("../controllers/TaxSettingController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("TaxSetting", "canCreate"),
  c.createTaxSetting,
);
router.get("/", checkPermission("TaxSetting", "canView"), c.getAllTaxSetting);
router.get(
  "/:id",
  checkPermission("TaxSetting", "canView"),
  c.getTaxSettingById,
);
router.put(
  "/:id",
  checkPermission("TaxSetting", "canEdit"),
  c.updateTaxSetting,
);
router.delete(
  "/:id",
  checkPermission("TaxSetting", "canDelete"),
  c.deleteTaxSetting,
);
module.exports = router;
