const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    logNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RolePermission",
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },

    module: {
      type: String,
      required: true,
      enum: [
        "Dashboard",
        "User",
        "Role",
        "Store",
        "Supplier",
        "Customer",
        "Category",
        "SubCategory",
        "Brand",
        "Product",
        "Purchase",
        "Purchase Return",
        "Sales Invoice",
        "Sales Return",
        "Payment",
        "Expense",
        "Stock",
        "Stock Adjustment",
        "Warehouse",
        "Reports",
        "Settings",
        "Authentication",
        "Others"
      ],
    },

    action: {
      type: String,
      required: true,
      enum: [
        "Create",
        "Update",
        "Delete",
        "View",
        "Login",
        "Logout",
        "Export",
        "Import",
        "Print",
        "Approve",
        "Reject"
      ],
    },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    requestMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      default: "POST",
    },

    requestUrl: {
      type: String,
      default: "",
    },

    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    oldValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: "",
    },

    browser: {
      type: String,
      default: "",
    },

    operatingSystem: {
      type: String,
      default: "",
    },

    device: {
      type: String,
      default: "",
    },

    macAddress: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Success",
        "Failed",
        "Warning"
      ],
      default: "Success",
    },

    errorMessage: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
Indexes
*/

auditLogSchema.index({ logNumber: 1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
);