const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");

const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// ============================================================
// CREATE NOTIFICATION
// POST /api/notifications/create
// ============================================================
exports.createNotification = asyncHandler(async (req, res) => {
  const {
    store,
    sender,
    receiver,
    title,
    message,
    type,
    priority,
    referenceId,
    referenceModel,
  } = req.body;

  const createdBy = req.user?.id;

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  if (!createdBy) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. User ID not found.",
    });
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  if (!store) {
    return res.status(400).json({
      success: false,
      message: "Store is required.",
    });
  }

  if (!sender) {
    return res.status(400).json({
      success: false,
      message: "Sender is required.",
    });
  }

  if (!receiver) {
    return res.status(400).json({
      success: false,
      message: "Receiver is required.",
    });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Notification title is required.",
    });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "Notification message is required.",
    });
  }

  // ============================================================
  // OBJECT ID VALIDATION
  // ============================================================

  if (!mongoose.Types.ObjectId.isValid(store)) {
    return res.status(400).json({
      success: false,
      message: "Invalid store ID.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(sender)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sender ID.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(receiver)) {
    return res.status(400).json({
      success: false,
      message: "Invalid receiver ID.",
    });
  }

  // ============================================================
  // CREATE NOTIFICATION
  // ============================================================

  const notification = await Notification.create({
    store,
    sender,
    receiver,
    title: title.trim(),
    message: message.trim(),
    type: type || "general",
    priority: priority || "Medium",
    referenceId: referenceId || undefined,
    referenceModel: referenceModel || undefined,
    createdBy,
  });

  // ============================================================
  // POPULATE RESPONSE
  // ============================================================

  const populatedNotification =
    await Notification.findById(notification._id)
      .populate("store", "storeName storeCode")
      .populate("sender", "firstName lastName email")
      .populate("receiver", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");

  return success(
    res,
    "Notification created successfully.",
    populatedNotification,
    201
  );
});

// ============================================================
// GET MY NOTIFICATIONS
// GET /api/notifications/my
// ============================================================
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid user ID.",
    });
  }

  const {
    page = 1,
    limit = 10,
    type,
    isRead,
    search,
  } = req.query;

  const filter = {
    receiver: userId,
    status: true,
  };

  // ============================================================
  // FILTER BY TYPE
  // ============================================================

  if (type) {
    filter.type = type;
  }

  // ============================================================
  // FILTER BY READ STATUS
  // ============================================================

  if (isRead !== undefined) {
    filter.isRead = isRead === "true";
  }

  // ============================================================
  // SEARCH
  // ============================================================

  if (search && search.trim()) {
    filter.$or = [
      {
        title: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        message: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const skip = (pageNumber - 1) * limitNumber;

  // ============================================================
  // TOTAL
  // ============================================================

  const total = await Notification.countDocuments(filter);

  // ============================================================
  // GET NOTIFICATIONS
  // ============================================================

  const notifications = await Notification.find(filter)
    .populate("store", "storeName storeCode")
    .populate("sender", "firstName lastName")
    .populate("receiver", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .lean();

  return success(
    res,
    "Notifications retrieved successfully.",
    {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: notifications,
    }
  );
});

// ============================================================
// GET MY UNREAD COUNT
// GET /api/notifications/unread-count
// ============================================================
exports.getMyUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid user ID.",
    });
  }

  const unreadCount = await Notification.countDocuments({
    receiver: userId,
    isRead: false,
    status: true,
  });

  return success(
    res,
    "Unread notification count.",
    {
      unreadCount,
    }
  );
});

// ============================================================
// GET NOTIFICATION BY ID
// GET /api/notifications/:id
// ============================================================
exports.getNotificationById = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const notificationId = req.params.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    receiver: userId,
    status: true,
  })
    .populate("store", "storeName storeCode")
    .populate("sender", "firstName lastName email")
    .populate("receiver", "firstName lastName email")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  return success(
    res,
    "Notification details retrieved successfully.",
    notification
  );
});

// ============================================================
// MARK SINGLE NOTIFICATION AS READ
// PUT /api/notifications/read/:id
// ============================================================
exports.markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const notificationId = req.params.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      receiver: userId,
      status: true,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
        updatedBy: userId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("store", "storeName storeCode")
    .populate("sender", "firstName lastName")
    .populate("receiver", "firstName lastName");

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  return success(
    res,
    "Notification marked as read.",
    notification
  );
});

// ============================================================
// MARK ALL MY NOTIFICATIONS AS READ
// PUT /api/notifications/read-all
// ============================================================
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  const result = await Notification.updateMany(
    {
      receiver: userId,
      isRead: false,
      status: true,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
        updatedBy: userId,
      },
    }
  );

  return success(
    res,
    "All notifications marked as read.",
    {
      modifiedCount: result.modifiedCount,
    }
  );
});

// ============================================================
// DELETE MY NOTIFICATION
// DELETE /api/notifications/delete/:id
// ============================================================
exports.deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const notificationId = req.params.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      receiver: userId,
      status: true,
    },
    {
      $set: {
        status: false,
        updatedBy: userId,
      },
    },
    {
      new: true,
    }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  return success(
    res,
    "Notification deleted successfully."
  );
});

// ============================================================
// UPDATE MY NOTIFICATION
// PUT /api/notifications/update/:id
// ============================================================
exports.updateNotification = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const notificationId = req.params.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  // Don't allow changing ownership/audit fields from frontend
  const {
    store,
    sender,
    receiver,
    createdBy,
    updatedBy,
    ...allowedData
  } = req.body;

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      receiver: userId,
      status: true,
    },
    {
      $set: {
        ...allowedData,
        updatedBy: userId,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("store", "storeName storeCode")
    .populate("sender", "firstName lastName")
    .populate("receiver", "firstName lastName");

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  return success(
    res,
    "Notification updated successfully.",
    notification
  );
});

// ============================================================
// GET ALL NOTIFICATIONS
// ADMIN / INTERNAL USE
// GET /api/notifications/all
// ============================================================
exports.getAllNotification = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    receiver,
    sender,
    store,
    type,
    isRead,
    status = "true",
  } = req.query;

  const filter = {
    status: status === "true",
  };

  if (receiver) {
    filter.receiver = receiver;
  }

  if (sender) {
    filter.sender = sender;
  }

  if (store) {
    filter.store = store;
  }

  if (type) {
    filter.type = type;
  }

  if (isRead !== undefined) {
    filter.isRead = isRead === "true";
  }

  if (search && search.trim()) {
    filter.$or = [
      {
        title: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        message: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const total = await Notification.countDocuments(filter);

  const notifications = await Notification.find(filter)
    .populate("store", "storeName storeCode")
    .populate("sender", "firstName lastName")
    .populate("receiver", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .lean();

  return success(
    res,
    "Notification List",
    {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      data: notifications,
    }
  );
});