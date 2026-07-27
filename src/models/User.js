const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // employeeCode: {
    //   type: String,
    //   required: true,
    //   unique: true,
    //   trim: true,
    // },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
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

    profileImage: String,

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RolePermission",
      required: [true, "Role is required"],
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },

    designation: String,
    address: String,
    city: String,
    state: String,
    pincode: String,

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    salary: {
      type: Number,
      default: 0,
    },

    lastLogin: Date,

    refreshToken: String,

    resetPasswordOTP: String,

    resetPasswordOTPExpire: Date,

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
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
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
