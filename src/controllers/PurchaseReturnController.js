const PurchaseReturn = require("../models/PurchaseReturn");
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");
const mongoose = require("mongoose");

const generateReturnNo = async () => {
  const lastReturn = await PurchaseReturn.findOne()
    .sort({ createdAt: -1 })
    .select("returnNo");

  if (!lastReturn || !lastReturn.returnNo) {
    return "PRTN-000001";
  }

  const lastNumber = parseInt(lastReturn.returnNo.split("-")[1]) || 0;

  return `PRTN-${String(lastNumber + 1).padStart(6, "0")}`;
};

/* ======================================================
   Create Purchase Return
====================================================== */

exports.createPurchaseReturn = async (req, res) => {
  try {
    const {
      purchase,
      supplier,
      store,
      warehouse,
      returnDate,
      returnStatus,
      items,
      reason,
      remarks,
    } = req.body;

    /* ===============================
       Required Fields Validation
    =============================== */

    if (!purchase) {
      return res.status(400).json({
        success: false,
        message: "Purchase is required",
      });
    }

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier is required",
      });
    }

    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Store is required",
      });
    }

    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: "Warehouse is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one return item is required",
      });
    }

    /* ===============================
       Validate Purchase
    =============================== */

    const purchaseData = await Purchase.findById(purchase);

    if (!purchaseData) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    /* ===============================
       Validate Supplier
    =============================== */

    const supplierData = await Supplier.findById(supplier);

    if (!supplierData) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    /* ===============================
       Validate Store
    =============================== */

    const storeData = await Store.findById(store);

    if (!storeData) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    /* ===============================
       Validate Warehouse
    =============================== */

    const warehouseData = await Warehouse.findById(warehouse);

    if (!warehouseData) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    /* ===============================
       Validate Products
    =============================== */

    let totalRefund = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found : ${item.product}`,
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `${item.productName} quantity must be greater than zero`,
        });
      }

      if (item.refundAmount < 0) {
        return res.status(400).json({
          success: false,
          message: `${item.productName} refund amount is invalid`,
        });
      }

      totalRefund += Number(item.refundAmount);
    }

    /* ===============================
       Generate Return Number
    =============================== */

    const returnNo = await generateReturnNo();

    /* ===============================
       Create Purchase Return
    =============================== */

    const purchaseReturn = await PurchaseReturn.create({
      returnNo,
      purchase,
      supplier,
      store,
      warehouse,
      returnDate,
      returnStatus,
      items,
      refundAmount: totalRefund,
      reason,
      remarks,
      createdBy: req.user?.id || null,
    });

    /* ===============================
       Populate Response
    =============================== */

    const response = await PurchaseReturn.findById(purchaseReturn._id)
      .populate("purchase", "purchaseNo")
      .populate("supplier", "supplierName")
      .populate("store", "storeName")
      .populate("warehouse", "warehouseName")
      .populate("items.product", "productName skuCode");

    return res.status(201).json({
      success: true,
      message: "Purchase Return created successfully",
      data: response,
    });
  } catch (error) {
  console.error("==================================");
  console.error(error);
  console.error(error.stack);
  console.error("==================================");

  return res.status(500).json({
    success: false,
    message: error.message,
    stack: error.stack,
  });
}
};
/* ======================================================
   Get All Purchase Returns
====================================================== */

exports.getPurchaseReturns = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      supplier,
      purchase,
      store,
      warehouse,
      returnStatus,
      fromDate,
      toDate,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = {
      isDeleted: false,
    };

    /* ===============================
       Search
    =============================== */

    if (search) {
      filter.returnNo = {
        $regex: search,
        $options: "i",
      };
    }

    /* ===============================
       Filters
    =============================== */

    if (supplier) {
      filter.supplier = supplier;
    }

    if (purchase) {
      filter.purchase = purchase;
    }

    if (store) {
      filter.store = store;
    }

    if (warehouse) {
      filter.warehouse = warehouse;
    }

    if (returnStatus) {
      filter.returnStatus = returnStatus;
    }

    /* ===============================
       Date Filter
    =============================== */

    if (fromDate || toDate) {
      filter.returnDate = {};

      if (fromDate) {
        filter.returnDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.returnDate.$lte = new Date(toDate);
      }
    }

    /* ===============================
       Sorting
    =============================== */

    const sort = {};

    sort[sortBy] = order === "asc" ? 1 : -1;

    /* ===============================
       Fetch Data
    =============================== */

    const purchaseReturns = await PurchaseReturn.find(filter)
      .populate("purchase", "purchaseNo purchaseDate")
      .populate("supplier", "supplierName supplierCode")
      .populate("store", "storeName")
      .populate("warehouse", "warehouseName")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    /* ===============================
       Total Count
    =============================== */

    const totalRecords = await PurchaseReturn.countDocuments(filter);

    const totalPages = Math.ceil(totalRecords / limit);

    /* ===============================
       Response
    =============================== */

    return res.status(200).json({
      success: true,
      message: "Purchase Returns fetched successfully",

      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      data: purchaseReturns,
    });
  } catch (error) {
    console.error("Get Purchase Returns Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Get Purchase Return By ID
====================================================== */

exports.getPurchaseReturnById = async (req, res) => {
  try {
    const { id } = req.params;

    /* ===============================
       Validate ObjectId
    =============================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Purchase Return ID",
      });
    }

    /* ===============================
       Find Purchase Return
    =============================== */

    const purchaseReturn = await PurchaseReturn.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate({
        path: "purchase",
        select: "purchaseNo purchaseDate invoiceNo totalAmount paymentStatus",
      })
      .populate({
        path: "supplier",
        select: "supplierName supplierCode phone email gstNumber address",
      })
      .populate({
        path: "store",
        select: "storeName storeCode address phone",
      })
      .populate({
        path: "warehouse",
        select: "warehouseName warehouseCode",
      })
      .populate({
        path: "items.product",
        select: "productName skuCode barcode category brand",
      })
      .populate({
        path: "items.variant",
        select: "variantName size color purchasePrice sellingPrice",
      })
      .populate({
        path: "items.batch",
        select: "batchNo expiryDate manufacturingDate",
      })
      .populate({
        path: "createdBy",
        select: "name email employeeCode",
      })
      .populate({
        path: "updatedBy",
        select: "name email employeeCode",
      });

    /* ===============================
       Not Found
    =============================== */

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase Return not found",
      });
    }

    /* ===============================
       Success Response
    =============================== */

    return res.status(200).json({
      success: true,
      message: "Purchase Return fetched successfully",
      data: purchaseReturn,
    });
  } catch (error) {
    console.error("Get Purchase Return By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================

   Validation Helper Functions

===================================================== */

// Validate MongoDB ObjectId

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Check Required Field

const isEmpty = (value) => {
  return value === undefined || value === null || value === "";
};

// Validate Return Items

const validateItems = (items) => {
  if (!Array.isArray(items)) {
    return "Items must be an array.";
  }

  if (items.length === 0) {
    return "At least one item is required.";
  }

  return null;
};

/* =====================================================

   Update Purchase Return

===================================================== */

exports.updatePurchaseReturn = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      purchase,

      supplier,

      store,

      warehouse,

      returnDate,

      returnStatus,

      items,

      reason,

      remarks,
    } = req.body;

    /* ============================================

       Validate Purchase Return ID

    ============================================ */

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid Purchase Return ID",
      });
    }

    /* ============================================

       Find Existing Purchase Return

    ============================================ */

    const purchaseReturn = await PurchaseReturn.findOne({
      _id: id,

      isDeleted: false,
    });

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,

        message: "Purchase Return not found",
      });
    }

    /* ============================================

       Validate Required Fields

    ============================================ */

    if (isEmpty(purchase)) {
      return res.status(400).json({
        success: false,

        message: "Purchase is required.",
      });
    }

    if (isEmpty(supplier)) {
      return res.status(400).json({
        success: false,

        message: "Supplier is required.",
      });
    }

    if (isEmpty(store)) {
      return res.status(400).json({
        success: false,

        message: "Store is required.",
      });
    }

    if (isEmpty(warehouse)) {
      return res.status(400).json({
        success: false,

        message: "Warehouse is required.",
      });
    }

    const itemValidation = validateItems(items);

    if (itemValidation) {
      return res.status(400).json({
        success: false,

        message: itemValidation,
      });
    }
    /* ============================================
   Validate Purchase
============================================ */

    const purchaseData = await Purchase.findById(purchase);

    if (!purchaseData) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found.",
      });
    }

    /* ============================================
   Validate Supplier
============================================ */

    const supplierData = await Supplier.findById(supplier);

    if (!supplierData) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    /* ============================================
   Validate Store
============================================ */

    const storeData = await Store.findById(store);

    if (!storeData) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    /* ============================================
   Validate Warehouse
============================================ */

    const warehouseData = await Warehouse.findById(warehouse);

    if (!warehouseData) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found.",
      });
    }

    /* ============================================
   Validate Products & Calculate Totals
============================================ */

    let totalRefundAmount = 0;
    let totalQuantity = 0;

    const updatedItems = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Product Id.",
        });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found : ${item.product}`,
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `${item.productName} quantity should be greater than zero.`,
        });
      }

      if (item.refundAmount < 0) {
        return res.status(400).json({
          success: false,
          message: `${item.productName} refund amount is invalid.`,
        });
      }

      totalQuantity += Number(item.quantity);

      totalRefundAmount += Number(item.refundAmount);

      updatedItems.push({
        product: item.product,
        variant: item.variant || null,
        batch: item.batch || null,
        skuCode: item.skuCode || "",
        barcode: item.barcode || "",
        productName: item.productName,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        refundAmount: item.refundAmount,
        reason: item.reason || "",
      });
    }

    /* ============================================
   Prepare Updated Document
============================================ */

    purchaseReturn.purchase = purchase;
    purchaseReturn.supplier = supplier;
    purchaseReturn.store = store;
    purchaseReturn.warehouse = warehouse;

    purchaseReturn.returnDate = returnDate || purchaseReturn.returnDate;

    purchaseReturn.returnStatus = returnStatus || purchaseReturn.returnStatus;

    purchaseReturn.items = updatedItems;

    purchaseReturn.totalQuantity = totalQuantity;

    purchaseReturn.refundAmount = Number(totalRefundAmount.toFixed(2));

    purchaseReturn.reason = reason || "";

    purchaseReturn.remarks = remarks || "";

    purchaseReturn.updatedBy = req.user?.id || null;

    /* ============================================
   Save Updated Purchase Return
============================================ */

    await purchaseReturn.save();

    /* ============================================
   Populate Updated Document
============================================ */

    const updatedPurchaseReturn = await PurchaseReturn.findById(
      purchaseReturn._id,
    )
      .populate({
        path: "purchase",
        select: "purchaseNo purchaseDate invoiceNo totalAmount",
      })
      .populate({
        path: "supplier",
        select: "supplierName supplierCode phone email",
      })
      .populate({
        path: "store",
        select: "storeName storeCode",
      })
      .populate({
        path: "warehouse",
        select: "warehouseName warehouseCode",
      })
      .populate({
        path: "items.product",
        select: "productName skuCode barcode",
      })
      .populate({
        path: "items.variant",
        select: "variantName color size",
      })
      .populate({
        path: "items.batch",
        select: "batchNo manufacturingDate expiryDate",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "updatedBy",
        select: "name email",
      });

    /* ============================================
   Success Response
============================================ */

    return res.status(200).json({
      success: true,
      message: "Purchase Return updated successfully.",
      data: updatedPurchaseReturn,
    });
  } catch (error) {
    console.error("Update Purchase Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { returnStatus } = req.body;

    /* ===============================

       Validate ObjectId

    =============================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,

        message: "Invalid Purchase Return ID",
      });
    }

    /* ===============================

       Validate Status

    =============================== */

    const allowedStatus = ["Pending", "Approved", "Rejected", "Completed"];

    if (!returnStatus) {
      return res.status(400).json({
        success: false,

        message: "Return status is required.",
      });
    }

    if (!allowedStatus.includes(returnStatus)) {
      return res.status(400).json({
        success: false,

        message: `Return status must be one of: ${allowedStatus.join(", ")}`,
      });
    }

    /* ===============================

       Find Purchase Return

    =============================== */

    const purchaseReturn = await PurchaseReturn.findOne({
      _id: id,

      isDeleted: false,
    });

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,

        message: "Purchase Return not found.",
      });
    }

    /* ===============================

       Update Status

    =============================== */

    purchaseReturn.returnStatus = returnStatus;

    purchaseReturn.updatedBy = req.user?.id || null;

    await purchaseReturn.save();

    /* ===============================

       Populate Response

    =============================== */

    const updatedPurchaseReturn = await PurchaseReturn.findById(
      purchaseReturn._id,
    )

      .populate("purchase", "purchaseNo purchaseDate")

      .populate("supplier", "supplierName supplierCode")

      .populate("store", "storeName")

      .populate("warehouse", "warehouseName")

      .populate("createdBy", "name email")

      .populate("updatedBy", "name email");

    /* ===============================

       Success Response

    =============================== */

    return res.status(200).json({
      success: true,

      message: "Purchase Return status updated successfully.",

      data: updatedPurchaseReturn,
    });
  } catch (error) {
    console.error("Update Purchase Return Status Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Internal Server Error",
    });
  }
};

exports.deletePurchaseReturn = async (req, res) => {
  try {
    const { id } = req.params;

    // ==========================================
    // 1. Validate Purchase Return ID
    // ==========================================

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Purchase Return ID",
      });
    }

    // ==========================================
    // 2. Find Purchase Return
    // ==========================================

    const purchaseReturn = await PurchaseReturn.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase Return not found or already deleted",
      });
    }

    // ==========================================
    // 3. Prevent Delete for Completed Return
    // ==========================================

    if (purchaseReturn.returnStatus === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed Purchase Return cannot be deleted.",
      });
    }

    // ==========================================
    // 4. Soft Delete
    // ==========================================

    purchaseReturn.isDeleted = true;
    purchaseReturn.updatedBy = req.user?.id || null;

    await purchaseReturn.save();

    // ==========================================
    // 5. Success Response
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Purchase Return deleted successfully.",
      data: {
        id: purchaseReturn._id,
        isDeleted: purchaseReturn.isDeleted,
      },
    });
  } catch (error) {
    console.error("Delete Purchase Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};