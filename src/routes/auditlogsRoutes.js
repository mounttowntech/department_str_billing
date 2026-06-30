const router = require("express").Router();
const c = require("../controllers/AuditLogController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/", checkPermission("AuditLog", "canCreate"), c.createAuditLog);
router.get("/", checkPermission("AuditLog", "canView"), c.getAllAuditLog);
router.get("/:id", checkPermission("AuditLog", "canView"), c.getAuditLogById);
router.put("/:id", checkPermission("AuditLog", "canEdit"), c.updateAuditLog);
router.delete(
  "/:id",
  checkPermission("AuditLog", "canDelete"),
  c.deleteAuditLog,
);
module.exports = router;
