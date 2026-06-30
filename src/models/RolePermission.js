const mongoose = require("mongoose");
const permissionSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    canView: { type: Boolean, default: false },
    canCreate: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canPrint: { type: Boolean, default: false },
    canExport: { type: Boolean, default: false },
    canImport: { type: Boolean, default: false },
    canApprove: { type: Boolean, default: false },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    roleCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    roleName: { type: String, required: true, unique: true, trim: true },
    description: String,
    isSystemRole: { type: Boolean, default: false },
    dashboardAccess: { type: Boolean, default: true },
    permissions: [permissionSchema],
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("RolePermission", schema);
