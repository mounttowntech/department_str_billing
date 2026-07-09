const router = require("express").Router();
const c = require("../controllers/AuditLogController");
// const { protect, checkPermission } = require("../middleware/authMiddleware");
// router.use(protect);
router.post("/create",c.createAuditLog);
router.get("/all",  c.getAllAuditLog);
router.get("/:id",  c.getAuditLogById);
router.put("/:id",  c.updateAuditLog);
router.delete(
  "/:id",
  
  c.deleteAuditLog,
);
module.exports = router;
