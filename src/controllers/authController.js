const User = require("../models/User");
const RolePermission = require("../models/RolePermission");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
exports.register = async (req, res) => {
    try {

        const {
            firstName,
            lastName,
            email,
            phone,
            password,
            role,
            store,
            designation,
            address,
            city,
            state,
            pincode,
            salary
        } = req.body;

        if (!role) {
            return res.status(400).json({
                success:false,
                message:"Role is required"
            });
        }

        const roleExists = await RolePermission.findById(role);

        if (!roleExists) {
            return res.status(404).json({
                success:false,
                message:"Invalid role"
            });
        }

        const exists = await User.findOne({
            $or:[
                {email},
                {phone}
            ]
        });

        if(exists){
            return res.status(400).json({
                success:false,
                message:"User already exists"
            });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            phone,
            password,
            role,
            store,
            designation,
            address,
            city,
            state,
            pincode,
            salary
        });

        res.status(201).json({
            success:true,
            message:"User registered successfully",
            data:user
        });

    } catch (err) {

        res.status(500).json({
            success:false,
            message:err.message
        });

    }
};
exports.login = async (req,res)=>{

    try{

        const {email,password}=req.body;

        const user = await User.findOne({email})
        .select("+password")
        .populate("role")
        .populate("store");

        if(!user){
            return res.status(404).json({
                success:false,
                message:"Invalid email"
            });
        }

        if(user.status==="blocked"){
            return res.status(403).json({
                success:false,
                message:"Account blocked"
            });
        }

        const match = await user.comparePassword(password);

        if(!match){
            return res.status(401).json({
                success:false,
                message:"Invalid password"
            });
        }

        const token = jwt.sign(
            {
                id:user._id,
                role:user.role._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn:"7d"
            }
        );

        user.lastLogin=new Date();

        await user.save();

        res.json({
            success:true,
            token,
            user
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};


exports.forgotPassword = async(req,res)=>{

    try{

        const {email}=req.body;

        const user=await User.findOne({email});

        if(!user){

            return res.status(404).json({
                success:false,
                message:"User not found"
            });

        }

        const otp=Math.floor(100000+Math.random()*900000).toString();

        user.resetPasswordOTP=otp;

        user.resetPasswordOTPExpire=Date.now()+10*60*1000;

        await user.save();

        // Send OTP using Nodemailer

        res.json({
            success:true,
            message:"OTP sent successfully"
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};
exports.resetPassword = async(req,res)=>{

    try{

        const {
            email,
            otp,
            password
        }=req.body;

        const user=await User.findOne({
            email,
            resetPasswordOTP:otp,
            resetPasswordOTPExpire:{
                $gt:Date.now()
            }
        }).select("+password");

        if(!user){

            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            });

        }

        user.password=password;

        user.resetPasswordOTP=undefined;

        user.resetPasswordOTPExpire=undefined;

        await user.save();

        res.json({
            success:true,
            message:"Password changed successfully"
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};
exports.changePassword = async(req,res)=>{

    try{

        const {
            oldPassword,
            newPassword
        }=req.body;

        const user=await User.findById(req.user.id)
        .select("+password");

        const match=await user.comparePassword(oldPassword);

        if(!match){

            return res.status(400).json({
                success:false,
                message:"Old password is incorrect"
            });

        }

        user.password=newPassword;

        await user.save();

        res.json({
            success:true,
            message:"Password updated successfully"
        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};