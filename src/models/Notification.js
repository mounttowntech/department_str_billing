const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "general" },
    referenceId: mongoose.Schema.Types.ObjectId,
    referenceModel: String,
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true, versionKey: false },
);
module.exports = mongoose.model("Notification", schema);
