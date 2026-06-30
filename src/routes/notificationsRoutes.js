const router = require("express").Router();
const c = require("../controllers/NotificationController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("Notification", "canCreate"),
  c.createNotification,
);
router.get(
  "/",
  checkPermission("Notification", "canView"),
  c.getAllNotification,
);
router.get(
  "/:id",
  checkPermission("Notification", "canView"),
  c.getNotificationById,
);
router.put(
  "/:id",
  checkPermission("Notification", "canEdit"),
  c.updateNotification,
);
router.delete(
  "/:id",
  checkPermission("Notification", "canDelete"),
  c.deleteNotification,
);
module.exports = router;
