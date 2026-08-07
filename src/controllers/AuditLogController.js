const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const Store = require("../models/Store");

const generateAuditLogNumber = require("../utils/generateAuditLogNumber");

exports.createAuditLog = async (req, res) => {
  try {
    const {
      user,
      store,
      module,
      action,
      recordId,
      description,
      requestBody,
      oldValues,
      newValues,
      status,
      errorMessage,
    } = req.body;

    // Generate Log Number
    const logNumber = await generateAuditLogNumber();

    // User Validation
    const userId = user || req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User is required",
      });
    }

    const userExists = await User.findById(userId);

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Store Validation
    if (store) {
      const storeExists = await Store.findById(store);

      if (!storeExists) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }
    }

    const auditLog = new AuditLog({
      logNumber,
      user: userId,
      store,
      module,
      action,
      recordId,
      description,

      requestMethod: req.method,
      requestUrl: req.originalUrl,

      requestBody: requestBody || req.body,

      oldValues,
      newValues,

      ipAddress:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        req.ip,

      browser: req.headers["user-agent"],

      device: req.headers["sec-ch-ua-platform"] || "Unknown",

      status: status || "Success",

      errorMessage,
    });

    await auditLog.save();

    const result = await AuditLog.findById(auditLog._id)
      .populate("user", "firstName lastName email employeeCode")
      .populate("store", "storeName storeCode");

    return res.status(201).json({
      success: true,
      message: "Audit Log created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create Audit Log Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getAllAuditLog = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      module,
      action,
      status,
      user,
      store,
      fromDate,
      toDate,
      search,
    } = req.query;

    const filter = {};

    if (module) filter.module = module;

    if (action) filter.action = action;

    if (status) filter.status = status;

    if (user) filter.user = user;

    if (store) filter.store = store;

    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (search) {
      filter.$or = [
        {
          logNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          module: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const total = await AuditLog.countDocuments(filter);

    const data = await AuditLog.find(filter)
      .populate("user", "firstName lastName email employeeCode")
      .populate("store", "storeName storeCode")
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      totalRecords: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getAuditLogById = async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id)
      .populate("user", "firstName lastName email employeeCode")
      .populate("store", "storeName storeCode");

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit Log not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: auditLog,
    });
  } catch (error) {
    console.error("Get Audit Log Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.updateAuditLog = async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id);

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit Log not found",
      });
    }

    Object.assign(auditLog, req.body);

    await auditLog.save();

    const result = await AuditLog.findById(auditLog._id)
      .populate("user", "firstName lastName email employeeCode")
      .populate("store", "storeName storeCode");

    return res.status(200).json({
      success: true,
      message: "Audit Log updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update Audit Log Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.deleteAuditLog = async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id);

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit Log not found",
      });
    }

    await auditLog.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Audit Log deleted successfully",
    });
  } catch (error) {
    console.error("Delete Audit Log Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};