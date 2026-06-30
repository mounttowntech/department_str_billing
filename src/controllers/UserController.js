const User=require('../models/User'); const RolePermission=require('../models/RolePermission'); const asyncHandler=require('../utils/asyncHandler'); const {success}=require('../utils/responseHandler'); const generateToken=require('../utils/generateToken'); const ApiError=require('../utils/ApiError');
exports.register=asyncHandler(async(req,res)=>{const user=await User.create(req.body); success(res,'User created',{user},201);});
exports.login=asyncHandler(async(req,res)=>{const {email,password}=req.body; const user=await User.findOne({email}).select('+password').populate('role'); if(!user||!(await user.comparePassword(password))) throw new ApiError('Invalid email or password',401); user.lastLogin=new Date(); await user.save(); success(res,'Login success',{token:generateToken(user),user});});
exports.me=asyncHandler(async(req,res)=>success(res,'Profile',req.user));
exports.createUser=exports.register;
exports.getAllUser=asyncHandler(async(req,res)=>success(res,'User list',await User.find().populate('role store').sort({createdAt:-1})));
exports.getUserById=asyncHandler(async(req,res)=>success(res,'User details',await User.findById(req.params.id).populate('role store')));
exports.updateUser=asyncHandler(async(req,res)=>success(res,'User updated',await User.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})));
exports.deleteUser=asyncHandler(async(req,res)=>{await User.findByIdAndDelete(req.params.id); success(res,'User deleted');});
