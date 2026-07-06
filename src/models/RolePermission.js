const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
    },

    canView: {
      type: Boolean,
      default: false,
    },

    canCreate: {
      type: Boolean,
      default: false,
    },

    canEdit: {
      type: Boolean,
      default: false,
    },

    canDelete: {
      type: Boolean,
      default: false,
    },

    canPrint: {
      type: Boolean,
      default: false,
    },

    canExport: {
      type: Boolean,
      default: false,
    },

    canImport: {
      type: Boolean,
      default: false,
    },

    canApprove: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const rolePermissionSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    roleCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    roleName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    isSystemRole: {
      type: Boolean,
      default: false,
    },

    dashboardAccess: {
      type: Boolean,
      default: true,
    },

    permissions: {
      type: [permissionSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// same role allowed in different stores, but not duplicated inside same store
rolePermissionSchema.index({ store: 1, roleCode: 1 }, { unique: true });
rolePermissionSchema.index({ store: 1, roleName: 1 }, { unique: true });

module.exports = mongoose.model("RolePermission", rolePermissionSchema);