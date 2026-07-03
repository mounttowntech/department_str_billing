const router = require("express").Router();
const c = require("../controllers/NotificationController");

router.post(
  "/create",
  
  c.createNotification,
);
router.get(
  "/all",
  
  c.getAllNotification,
);
router.get(
  "/:id",
 
  c.getNotificationById,
);
router.put(
  "/:id",
  
  c.updateNotification,
);
router.delete(
  "/:id",
 
  c.deleteNotification,
);
module.exports = router;
