const User = require("../models/User");
const RolePermission = require("../models/RolePermission");
const jwt = require("jsonwebtoken");
const Store =require("../models/Store");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    let {
      firstName,

      lastName,

      email,

      phone,

      password,

      role,

      store,

    //   designation,

      address,

      city,

      state,

      pincode,

      salary,
    } = req.body;

    // Trim inputs

    firstName = firstName?.trim();

    lastName = lastName?.trim();

    email = email?.trim().toLowerCase();

    phone = phone?.trim();

    // Required field validation

    if (!firstName || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,

        message: "First name, email, phone, password and role are required.",
      });
    }

    // Check role exists

    const roleExists = await RolePermission.findById(role);

    if (!roleExists) {
      return res.status(404).json({
        success: false,

        message: "Invalid role.",
      });
    }

    // Check store exists (optional)

    if (store) {
      const storeExists = await Store.findById(store);

      if (!storeExists) {
        return res.status(404).json({
          success: false,

          message: "Invalid store.",
        });
      }
    }

    // Check email already exists

    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).json({
        success: false,

        message: "Email already exists.",
      });
    }

    // Check phone already exists

    const phoneExists = await User.findOne({ phone });

    if (phoneExists) {
      return res.status(400).json({
        success: false,

        message: "Phone number already exists.",
      });
    }

    // Create user

    const user = await User.create({
      firstName,

      lastName,

      email,

      phone,

      password,

      role,

      store,

    //   designation,

      address,

      city,

      state,

      pincode,

      salary,
    });

    // Remove password from response

    const userData = user.toObject();

    delete userData.password;

    return res.status(201).json({
      success: true,

      message: "User registered successfully.",

      data: userData,
    });
  } catch (err) {
    console.error(err);

    // Handle MongoDB duplicate key error

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];

      return res.status(400).json({
        success: false,

        message: `${field} already exists.`,
      });
    }

    return res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("+password")
      .populate("role")
      .populate("store");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Account blocked",
      });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    user.lastLogin = new Date();

    await user.save();

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = otp;

    user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Send OTP using Nodemailer

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: {
        $gt: Date.now(),
      },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.password = password;

    user.resetPasswordOTP = undefined;

    user.resetPasswordOTPExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    const match = await user.comparePassword(oldPassword);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    user.password = newPassword;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
