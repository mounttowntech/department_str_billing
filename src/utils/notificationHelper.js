const Notification = require("../models/Notification");

const triggerNotification = async ({
  store,
  sender,
  receiver,
  title,
  message,
  type = "general",
  priority = "Medium",
  referenceId,
  referenceModel,
  createdBy,
}) => {
  try {
    if (!store || !title || !message) {
      console.error("⚠️ Notification helper missing required fields.");
      return null;
    }

    const notification = await Notification.create({
      store,
      sender: sender || createdBy,
      receiver: receiver || undefined,
      title: title.trim(),
      message: message.trim(),
      type: type || "general",
      priority: priority || "Medium",
      referenceId: referenceId || undefined,
      referenceModel: referenceModel || undefined,
      createdBy: createdBy || sender,
    });

    console.log(`🔔 Automatic notification created for store: ${store}`);
    return notification;
  } catch (error) {
    console.error("❌ Failed to create automatic notification:", error.message);
    return null;
  }
};

module.exports = triggerNotification;