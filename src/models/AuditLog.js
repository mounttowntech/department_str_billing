const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    logNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "RolePermission" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    module: { type: String, required: true },
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
        "Reject",
      ],
    },
    recordId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description: { type: String, required: true },
    requestMethod: String,
    requestUrl: String,
    requestBody: mongoose.Schema.Types.Mixed,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    browser: String,
    device: String,
    status: {
      type: String,
      enum: ["Success", "Failed", "Warning"],
      default: "Success",
    },
    errorMessage: String,
  },
  { timestamps: true, versionKey: false },
);
schema.index({ module: 1, action: 1, user: 1, createdAt: -1 });
module.exports = mongoose.model("AuditLog", schema);
