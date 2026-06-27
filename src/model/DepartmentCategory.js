const mongoose = require("mongoose");

const departmentCategorySchema = new mongoose.Schema(
  {
    categoryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    categoryName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    icon: {
      type: String,
      default: "",
    },

    departmentType: {
      type: String,
      enum: [
        "Grocery",
        "Fruits & Vegetables",
        "Dairy",
        "Bakery",
        "Beverages",
        "Snacks",
        "Personal Care",
        "Cosmetics",
        "Stationery",
        "Kitchen",
        "Home Care",
        "Electrical",
        "Electronics",
        "Clothing",
        "Footwear",
        "Toys",
        "Gift",
        "Medical",
        "Others"
      ],
      default: "Others",
    },

    taxSetting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxSetting",
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isFeatured: {
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

    status: {
      type: String,
      enum: [
        "active",
        "inactive"
      ],
      default: "active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

departmentCategorySchema.index({
  categoryCode:1
});

departmentCategorySchema.index({
  categoryName:1
});

departmentCategorySchema.index({
  departmentType:1
});

module.exports = mongoose.model(
  "DepartmentCategory",
  departmentCategorySchema
);