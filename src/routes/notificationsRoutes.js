const router = require("express").Router();

const c = require("../controllers/NotificationController");

// Create
router.post("/create", c.createNotification);

// Get All
router.get("/all", c.getAllNotification);

// Get By Id
router.get("/:id", c.getNotificationById);

// Update
router.put("/update/:id", c.updateNotification);

// Delete (Soft Delete)
router.delete("/delete/:id", c.deleteNotification);

// Mark Single Notification As Read
router.put("/read/:id", c.markAsRead);

// Mark All Notifications As Read
router.put("/read-all/:receiver", c.markAllAsRead);

// Get Unread Count
router.get("/unread-count/:receiver", c.getUnreadCount);

module.exports = router;