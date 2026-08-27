const mongoose = require("mongoose");

// ============================================================
// GET CURRENT PROFILE
// ============================================================

const getMyProfile = async (req, res) => {
  try {
    const User = mongoose.model("User");

    const userId = req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid or missing user ID.",
      });
    }

    const user = await User.findById(userId)
      .select("-password")
      .populate("role")
      .populate("store");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      user,
      data: user,
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile.",
      error: error.message,
    });
  }
};


// ============================================================
// UPDATE PROFILE
// PUT /api/profile/update
// ============================================================

const updateMyProfile = async (req, res) => {
  try {
    const User = mongoose.model("User");

    // User ID comes ONLY from JWT
    const userId = req.user?.id;

    console.log("====================================");
    console.log("PROFILE UPDATE REQUEST");
    console.log("====================================");
    console.log("JWT USER ID:", userId);
    console.log("REQUEST BODY:", req.body);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid or missing user ID.",
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
    } = req.body;


    // ========================================================
    // VALIDATION
    // ========================================================

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }


    // ========================================================
    // CLEAN DATA
    // ========================================================

    const cleanFirstName = firstName.trim();

    const cleanLastName =
      lastName?.trim() || "";

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanPhone =
      phone.trim();


    // ========================================================
    // CHECK EMAIL DUPLICATE
    // ========================================================

    const existingEmailUser = await User.findOne({
      email: cleanEmail,
      _id: {
        $ne: userId,
      },
    });

    if (existingEmailUser) {
      return res.status(409).json({
        success: false,
        message:
          "This email address is already registered with another account.",
      });
    }


    // ========================================================
    // CHECK PHONE DUPLICATE
    // ========================================================

    const existingPhoneUser = await User.findOne({
      phone: cleanPhone,
      _id: {
        $ne: userId,
      },
    });

    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message:
          "This phone number is already registered with another account.",
      });
    }


    // ========================================================
    // UPDATE ONLY PROFILE FIELDS
    // ========================================================

    const updateData = {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      phone: cleanPhone,
      updatedBy: userId,
    };


    console.log("====================================");
    console.log("UPDATING MONGODB");
    console.log("====================================");
    console.log("USER ID:", userId);
    console.log("UPDATE DATA:", updateData);


    // ========================================================
    // UPDATE DATABASE
    // ========================================================

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password")
      .populate("role")
      .populate("store");


    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }


    console.log("====================================");
    console.log("MONGODB PROFILE UPDATED");
    console.log("====================================");
    console.log("ID:", updatedUser._id);
    console.log("First Name:", updatedUser.firstName);
    console.log("Last Name:", updatedUser.lastName);
    console.log("Email:", updatedUser.email);
    console.log("Phone:", updatedUser.phone);


    // ========================================================
    // RETURN UPDATED USER
    // ========================================================

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
      data: updatedUser,
    });

  } catch (error) {

    console.error("====================================");
    console.error("UPDATE PROFILE ERROR");
    console.error("====================================");
    console.error(error);

    // Duplicate key error
    if (error.code === 11000) {

      const field =
        Object.keys(error.keyPattern || {})[0] || "field";

      return res.status(409).json({
        success: false,
        message: `${field} already exists.`,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update profile.",
    });
  }
};


// ============================================================
// CHANGE PASSWORD
// ============================================================

const changePassword = async (req, res) => {
  try {

    const User = mongoose.model("User");

    const userId = req.user?.id;

    const {
      oldPassword,
      newPassword,
    } = req.body;


    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }


    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Old password and new password are required.",
      });
    }


    const user =
      await User.findById(userId)
        .select("+password");


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }


    const match =
      await user.comparePassword(oldPassword);


    if (!match) {
      return res.status(400).json({
        success: false,
        message:
          "Old password is incorrect.",
      });
    }


    user.password = newPassword;

    await user.save();


    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully.",
    });

  } catch (error) {

    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to change password.",
    });
  }
};


module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
};