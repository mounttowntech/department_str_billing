const express = require("express");
const router = express.Router();

const auditLogController = require("../controllers/AuditLogController");

router.post("/create", auditLogController.createAuditLog);

router.get("/all", auditLogController.getAllAuditLog);

router.get("/:id", auditLogController.getAuditLogById);

router.put("/update/:id", auditLogController.updateAuditLog);

router.delete("/delete/:id", auditLogController.deleteAuditLog);

module.exports = router;