const response = require('../utils/responseHandler');
const success = response.success;
const asyncHandler = require('../utils/asyncHandler');
const Model = require('../models/Brand');
exports.createBrand = asyncHandler(async(req,res)=>{ const data=await Model.create({...req.body, createdBy:req.user?._id}); success(res,'Brand created',data,201); });
exports.getAllBrand = asyncHandler(async(req,res)=>{ const filter={}; if(req.query.status) filter.status=req.query.status; if(req.query.store) filter.store=req.query.store; const data=await Model.find(filter).sort({createdAt:-1}); success(res,'Brand list',data); });
exports.getBrandById = asyncHandler(async(req,res)=>{ const data=await Model.findById(req.params.id); if(!data) return res.status(404).json({success:false,message:'Brand not found'}); success(res,'Brand details',data); });
exports.updateBrand = asyncHandler(async(req,res)=>{ const data=await Model.findByIdAndUpdate(req.params.id,{...req.body,updatedBy:req.user?._id},{new:true,runValidators:true}); if(!data) return res.status(404).json({success:false,message:'Brand not found'}); success(res,'Brand updated',data); });
exports.deleteBrand = asyncHandler(async(req,res)=>{ const data=await Model.findByIdAndDelete(req.params.id); if(!data) return res.status(404).json({success:false,message:'Brand not found'}); success(res,'Brand deleted'); });
