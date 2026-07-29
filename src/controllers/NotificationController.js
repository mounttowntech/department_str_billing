const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");

const Notification = require("../models/Notification");

/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
*/
exports.createNotification = asyncHandler(async (req, res) => {
  const createdBy = req.user?._id || req.body.createdBy;

  const notification = await Notification.create({
    ...req.body,
    createdBy,
  });

  success(res, "Notification created successfully.", notification, 201);
});

/*
|--------------------------------------------------------------------------
| Get All Notifications
|--------------------------------------------------------------------------
*/
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
    status = true,
  } = req.query;

  const filter = {
    status: status === "true",
  };

  if (receiver) filter.receiver = receiver;
  if (sender) filter.sender = sender;
  if (store) filter.store = store;
  if (type) filter.type = type;

  if (isRead !== undefined) {
    filter.isRead = isRead === "true";
  }

  if (search) {
    filter.$or = [
      {
        title: {
          $regex: search,
          $options: "i",
        },
      },
      {
        message: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const total = await Notification.countDocuments(filter);

  const notifications = await Notification.find(filter)
    .populate("store", "storeName storeCode")
    .populate("sender", "firstName lastName")
    .populate("receiver", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  success(res, "Notification List", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: notifications,
  });
});

/*
|--------------------------------------------------------------------------
| Get Notification By ID
|--------------------------------------------------------------------------
*/
exports.getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)
    .populate("store")
    .populate("sender", "firstName lastName")
    .populate("receiver", "firstName lastName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  success(res, "Notification Details", notification);
});

/*
|--------------------------------------------------------------------------
| Update Notification
|--------------------------------------------------------------------------
*/
exports.updateNotification = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  success(res, "Notification updated successfully.", notification);
});

/*
|--------------------------------------------------------------------------
| Delete Notification (Soft Delete)
|--------------------------------------------------------------------------
*/
exports.deleteNotification = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      status: false,
      updatedBy,
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

  success(res, "Notification deleted successfully.");
});

/*
|--------------------------------------------------------------------------
| Mark As Read
|--------------------------------------------------------------------------
*/
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      isRead: true,
      readAt: new Date(),
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

  success(res, "Notification marked as read.", notification);
});

/*
|--------------------------------------------------------------------------
| Mark All As Read
|--------------------------------------------------------------------------
*/
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const { receiver } = req.params;

  await Notification.updateMany(
    {
      receiver,
      isRead: false,
      status: true,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  success(res, "All notifications marked as read.");
});

/*
|--------------------------------------------------------------------------
| Get Unread Count
|--------------------------------------------------------------------------
*/
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    receiver: req.params.receiver,
    isRead: false,
    status: true,
  });

  success(res, "Unread Notification Count", {
    unreadCount: count,
  });
});