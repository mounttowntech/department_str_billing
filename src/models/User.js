const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const schema = new mongoose.Schema(
  {
    employeeCode: { type: String, unique: true, required: true, trim: true },
    firstName: { type: String, required: true },
    lastName: String,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6, select: false },
    profileImage: String,
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RolePermission",
      required: true,
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    designation: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, default: 0 },
    lastLogin: Date,
    refreshToken: String,
    resetPasswordOTP: String,
    resetPasswordOTPExpire: Date,
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, versionKey: false },
);
schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
schema.methods.comparePassword = function (p) {
  return bcrypt.compare(p, this.password);
};
module.exports = mongoose.model("User", schema);
