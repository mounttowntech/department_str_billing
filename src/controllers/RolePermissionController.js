const RolePermission = require("../models/RolePermission");
const User = require("../models/User");

// CREATE ROLE PERMISSION
exports.createRolePermission = async (req, res) => {
  try {
    const role = await RolePermission.create({
      ...req.body,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Role permission created successfully",
      data: role,
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Role code or role name already exists in this store",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET ALL ROLE PERMISSION
exports.getAllRolePermission = async (req, res) => {
  try {

    const { store, status, search } = req.query;

    const filter = {};

    if (store) filter.store = store;
    if (status) filter.status = status;


    if (search) {
      filter.$or = [
        {
          roleCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          roleName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }


    const roles = await RolePermission.find(filter)
      .populate("store", "storeName storeCode")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({
        createdAt: -1,
      });


    res.json({
      success: true,
      count: roles.length,
      data: roles,
    });


  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// GET ROLE BY ID
exports.getRolePermissionById = async (req, res) => {
  try {

    const role = await RolePermission.findById(req.params.id)
      .populate("store", "storeName storeCode")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");


    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role permission not found",
      });
    }


    res.json({
      success: true,
      data: role,
    });


  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


// UPDATE ROLE PERMISSION
exports.updateRolePermission = async (req, res) => {

  try {

    const role = await RolePermission.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?.id,
      },
      {
        new: true,
        runValidators: true,
      }
    );


    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role permission not found",
      });
    }


    res.json({
      success: true,
      message: "Role permission updated successfully",
      data: role,
    });


  } catch (error) {


    if (error.code === 11000) {

      return res.status(400).json({
        success: false,
        message: "Role code or role name already exists in this store",
      });

    }


    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};



// DELETE ROLE PERMISSION WITH USER CHECK
exports.deleteRolePermission = async (req, res) => {

  try {

    const role = await RolePermission.findById(req.params.id);


    if (!role) {

      return res.status(404).json({
        success: false,
        message: "Role permission not found",
      });

    }


    // Check role assigned users
    const userExists = await User.findOne({
      role: role._id,
    });


    if (userExists) {

      return res.status(400).json({
        success: false,
        message: "Role is assigned to users. Cannot delete.",
      });

    }


    await role.deleteOne();


    res.json({
      success: true,
      message: "Role permission deleted successfully",
    });


  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};



// ACTIVATE ROLE
exports.activateRolePermission = async (req, res) => {

  try {

    const role = await RolePermission.findByIdAndUpdate(
      req.params.id,
      {
        status: "active",
        updatedBy: req.user?.id,
      },
      {
        new: true,
      }
    );


    if (!role) {

      return res.status(404).json({
        success: false,
        message: "Role permission not found",
      });

    }


    res.json({
      success: true,
      message: "Role permission activated successfully",
      data: role,
    });


  } catch(error) {

    res.status(500).json({
      success:false,
      message:error.message,
    });

  }

};



// TOGGLE ROLE STATUS
exports.toggleRolePermissionStatus = async (req, res) => {

  try {

    const role = await RolePermission.findById(req.params.id);


    if (!role) {

      return res.status(404).json({
        success:false,
        message:"Role permission not found",
      });

    }


    role.status =
      role.status === "active"
        ? "inactive"
        : "active";


    role.updatedBy = req.user?.id;


    await role.save();


    res.json({

      success:true,

      message:
        role.status === "active"
          ? "Role Activated Successfully"
          : "Role Deactivated Successfully",

      data:role,

    });


  } catch(error) {

    res.status(500).json({
      success:false,
      message:error.message,
    });

  }

};