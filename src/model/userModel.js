const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    profileImage: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },

    dob: {
      type: Date,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RolePermission",
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },

    designation: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    salary: {
      type: Number,
      default: 0,
    },

    loginAttempt: {
      type: Number,
      default: 0,
    },

    lastLogin: {
      type: Date,
    },

    refreshToken: {
      type: String,
      default: "",
    },

    resetPasswordOTP: {
      type: String,
      default: "",
    },

    resetPasswordOTPExpire: {
      type: Date,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "blocked"
      ],
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
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);

  next();

});

userSchema.methods.comparePassword = async function (password) {

  return await bcrypt.compare(
    password,
    this.password
  );

};

module.exports = mongoose.model(
  "User",
  userSchema
);