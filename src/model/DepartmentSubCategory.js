const mongoose = require("mongoose");

const departmentSubCategorySchema = new mongoose.Schema(
  {
    subCategoryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepartmentCategory",
      required: true,
    },

    subCategoryName: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    icon: {
      type: String,
      default: "",
    },

    taxSetting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxSetting",
    },

    shelfLifeDays: {
      type: Number,
      default: 0,
    },

    requiresBatch: {
      type: Boolean,
      default: false,
    },

    requiresExpiry: {
      type: Boolean,
      default: false,
    },

    allowDiscount: {
      type: Boolean,
      default: true,
    },

    allowReturn: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum:[
        "active",
        "inactive"
      ],
      default:"active"
    },

    createdBy:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    },

    updatedBy:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }

  },
  {
    timestamps:true,
    versionKey:false
  }
);

departmentSubCategorySchema.index({
    subCategoryCode:1
});

departmentSubCategorySchema.index({
    category:1
});

departmentSubCategorySchema.index({
    subCategoryName:1
});

module.exports=mongoose.model(
    "DepartmentSubCategory",
    departmentSubCategorySchema
);