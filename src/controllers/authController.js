const User = require("../models/User");
const RolePermission = require("../models/RolePermission");
const Store = require("../models/Store");
const triggerNotification = require("../utils/notificationHelper");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Email
const sendMail = require("../utils/sendMail");

const registerEmail = require("../templates/registerEmail");
const loginEmail = require("../templates/loginEmail");
const forgotPasswordEmail = require("../templates/forgotPasswordEmail");
const resetPasswordEmail = require("../templates/resetPasswordEmail");
const changePasswordEmail = require("../templates/changePasswordEmail");
const sendEmailSafely = async ({ to, subject, html }) => {
  try {
    await sendMail({
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}`);
    console.error(error.message);
  }
};
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
      address,
      city,
      state,
      pincode,
      salary,
    } = req.body;

    // Trim Inputs
    firstName = firstName?.trim();
    lastName = lastName?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim();

    // Validation
    if (!firstName || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "First name, email, phone, password and role are required.",
      });
    }

    // Check Role
    const roleExists = await RolePermission.findById(role);

    if (!roleExists) {
      return res.status(404).json({
        success: false,
        message: "Invalid role.",
      });
    }

    // Check Store
    if (store) {
      const storeExists = await Store.findById(store);

      if (!storeExists) {
        return res.status(404).json({
          success: false,
          message: "Invalid store.",
        });
      }
    }

    // Duplicate Email
    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // Duplicate Phone
    const phoneExists = await User.findOne({ phone });

    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists.",
      });
    }

    // Create User
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      store,
      address,
      city,
      state,
      pincode,
      salary,
    });

    // Send Welcome Email
    try {
      await sendMail({
        to: user.email,
        subject: "Welcome to WonderBill",
        html: registerEmail(user),
      });

      console.log("✅ Welcome email sent.");
    } catch (mailError) {
      console.error("❌ Welcome email failed.");
      console.error(mailError);
    }

    // Trigger Automatic Registration Notification
    if (user.store) {
      await triggerNotification({
        store: user.store,
        sender: req.user?._id || req.user?.id || user._id,
        receiver: user._id,
        title: "Account Created",
        message: `Welcome ${user.firstName}, your account has been successfully created.`,
        type: "system",
        priority: "Low",
        referenceId: user._id,
        referenceModel: "User",
        createdBy: req.user?._id || req.user?.id || user._id,
      });
    }

    // Remove Password
    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: userData,
    });
  } catch (err) {
    console.error(err);

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

    // JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || "7d",
      }
    );

    // Update Last Login
    user.lastLogin = new Date();

    // Send Login Email ONLY ON FIRST LOGIN
    if (user.isFirstLogin) {
      try {
        await sendMail({
          to: user.email,
          subject: "Welcome / Successful First Login",
          html: loginEmail(user),
        });

        console.log("✅ First login welcome email sent.");
      } catch (mailError) {
        console.error("❌ First login email failed.");
        console.error(mailError);
      }

      // Flip flag so it never sends again on future logins
      user.isFirstLogin = false;
    }

    await user.save();

    // Remove Password Before Response
    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: userData,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Generate Reset Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Send Reset Email
    await sendMail({
      to: user.email,
      subject: "Reset Password",
      html: forgotPasswordEmail(user, resetLink),
    });

    return res.status(200).json({
      success: true,
      message: "Password reset link sent successfully.",
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};
exports.resetPassword = async (req, res) => {

  try {

    const { token, password } = req.body;

    if (!token || !password) {

      return res.status(400).json({
        success: false,
        message: "Token and password are required.",
      });

    }

    let decoded;

    try {

      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    } catch {

      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or expired.",
      });

    }

    const user = await User.findById(decoded.id)
      .select("+password");

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });

    }

    user.password = password;

    await user.save();

    await sendMail({
      to: user.email,
      subject: "Password Reset Successful",
      html: resetPasswordEmail(user),
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const match = await user.comparePassword(oldPassword);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }

    user.password = newPassword;

    await user.save();

    // Send Email
    await sendEmailSafely({
      to: user.email,
      subject: "Password Changed Successfully",
      html: changePasswordEmail(user),
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("role")
      .populate("store");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};