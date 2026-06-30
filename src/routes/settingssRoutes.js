const router = require("express").Router();
const c = require("../controllers/SettingsController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/", checkPermission("Settings", "canCreate"), c.createSettings);
router.get("/", checkPermission("Settings", "canView"), c.getAllSettings);
router.get("/:id", checkPermission("Settings", "canView"), c.getSettingsById);
router.put("/:id", checkPermission("Settings", "canEdit"), c.updateSettings);
router.delete(
  "/:id",
  checkPermission("Settings", "canDelete"),
  c.deleteSettings,
);
module.exports = router;
