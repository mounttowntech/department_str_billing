const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    // Store
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    // Sender
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Receiver
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Message
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Notification Type
    type: {
      type: String,
      enum: [
        "general",
        "invoice",
        "purchase",
        "payment",
        "stock",
        "customer",
        "supplier",
        "expense",
        "offer",
        "loyalty",
        "system",
      ],
      default: "general",
    },

    // Priority
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    // Reference Document
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    referenceModel: {
      type: String,
      enum: [
        "SalesInvoice",
        "Purchase",
        "Payment",
        "Customer",
        "Supplier",
        "Expense",
        "Offer",
        "Product",
      ],
    },

    // Read Status
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
    },

    // Active / Deleted
    status: {
      type: Boolean,
      default: true,
    },

    // Audit
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
  },
);

// Indexes
schema.index({ receiver: 1, isRead: 1 });
schema.index({ store: 1 });
schema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", schema);
