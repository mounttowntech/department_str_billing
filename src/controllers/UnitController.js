const response = require('../utils/responseHandler');
const success = response.success;
const asyncHandler = require('../utils/asyncHandler');
const Model = require('../models/Unit');
exports.createUnit = asyncHandler(async(req,res)=>{ const data=await Model.create({...req.body, createdBy:req.user?._id}); success(res,'Unit created',data,201); });
exports.getAllUnit = asyncHandler(async(req,res)=>{ const filter={}; if(req.query.status) filter.status=req.query.status; if(req.query.store) filter.store=req.query.store; const data=await Model.find(filter).sort({createdAt:-1}); success(res,'Unit list',data); });
exports.getUnitById = asyncHandler(async(req,res)=>{ const data=await Model.findById(req.params.id); if(!data) return res.status(404).json({success:false,message:'Unit not found'}); success(res,'Unit details',data); });
exports.updateUnit = asyncHandler(async(req,res)=>{ const data=await Model.findByIdAndUpdate(req.params.id,{...req.body,updatedBy:req.user?._id},{new:true,runValidators:true}); if(!data) return res.status(404).json({success:false,message:'Unit not found'}); success(res,'Unit updated',data); });
exports.deleteUnit = asyncHandler(async(req,res)=>{ const data=await Model.findByIdAndDelete(req.params.id); if(!data) return res.status(404).json({success:false,message:'Unit not found'}); success(res,'Unit deleted'); });
