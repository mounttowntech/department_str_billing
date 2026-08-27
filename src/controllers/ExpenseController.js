const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");

const Expense = require("../models/Expense");

// ======================================================
// Create Expense
// ======================================================

exports.createExpense = asyncHandler(async (req, res) => {
  const createdBy = req.user?._id || req.body.createdBy;

  const expense = await Expense.create({
    ...req.body,
    createdBy,
  });

  success(res, "Expense created successfully", expense, 201);
});

// ======================================================
// Get All Expense
// ======================================================

exports.getAllExpense = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    store,
    supplier,
    status,
    approvalStatus,
    paymentMethod,
    fromDate,
    toDate,
  } = req.query;

  const filter = {};

  // Active / Deleted

  if (status) {
    filter.status = status;
  }

  // Store Filter

  if (store) {
    filter.store = store;
  }

  // Supplier Filter

  if (supplier) {
    filter.supplier = supplier;
  }

  // Approval Status

  if (approvalStatus) {
    filter.approvalStatus = approvalStatus;
  }

  // Payment Method

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  // Date Filter

  if (fromDate || toDate) {
    filter.expenseDate = {};

    if (fromDate) {
      filter.expenseDate.$gte = new Date(fromDate);
    }

    if (toDate) {
      const endDate = new Date(toDate);

      endDate.setHours(23, 59, 59, 999);

      filter.expenseDate.$lte = endDate;
    }
  }

  // Search

  if (search) {
    filter.$or = [
      {
        expenseNumber: {
          $regex: search,
          $options: "i",
        },
      },

      {
        expenseCategory: {
          $regex: search,
          $options: "i",
        },
      },

      {
        receiptNumber: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const total = await Expense.countDocuments(filter);

  const expenses = await Expense.find(filter)

    .populate("store", "storeName storeCode")

    .populate("supplier", "supplierName supplierCode")

    .populate("payment", "paymentNumber paymentStatus")

    .populate("taxSetting", "taxName percentage")

    .populate("createdBy", "firstName lastName")

    .populate("updatedBy", "firstName lastName")

    .populate("approvedBy", "firstName lastName")

    .sort({
      createdAt: -1,
    })

    .skip((Number(page) - 1) * Number(limit))

    .limit(Number(limit));

  success(res, "Expense list", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: expenses,
  });
});

// ======================================================
// Get Expense By ID
// ======================================================

exports.getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)

    .populate("store")

    .populate("supplier")

    .populate("payment")

    .populate("taxSetting")

    .populate("createdBy", "firstName lastName")

    .populate("approvedBy", "firstName lastName");

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found",
    });
  }

  success(res, "Expense details", expense);
});

// ======================================================
// Update Expense
// ======================================================

exports.updateExpense = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const expense = await Expense.findByIdAndUpdate(
    req.params.id,

    {
      ...req.body,
      updatedBy,
    },

    {
      new: true,
      runValidators: true,
    },
  );

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found",
    });
  }

  success(res, "Expense updated successfully", expense);
});

// ======================================================
// Delete Expense (Soft Delete)
// ======================================================

exports.deleteExpense = asyncHandler(async (req, res) => {
  const updatedBy = req.user?._id || req.body.updatedBy;

  const expense = await Expense.findByIdAndUpdate(
    req.params.id,

    {
      status: "cancelled",
      updatedBy,
    },

    {
      new: true,
    },
  );

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found",
    });
  }

  success(res, "Expense deleted successfully");
});

// ======================================================
// Approve Expense
// ======================================================

exports.approveExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found",
    });
  }

  expense.approvalStatus = "Approved";

  expense.approvedBy = req.user?._id;

  expense.approvedAt = new Date();

  await expense.save();

  success(res, "Expense approved successfully", expense);
});

// ======================================================
// Reject Expense
// ======================================================

exports.rejectExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found",
    });
  }

  expense.approvalStatus = "Rejected";

  expense.approvedBy = req.user?._id;

  expense.approvedAt = new Date();

  await expense.save();

  success(res, "Expense rejected successfully", expense);
});

// ======================================================
// Expense Summary Report
// ======================================================

exports.getExpenseSummary = asyncHandler(async (req, res) => {
  const { store, fromDate, toDate } = req.query;

  const match = {};

  if (store) {
    match.store = new mongoose.Types.ObjectId(store);
  }

  if (fromDate || toDate) {
    match.expenseDate = {};

    if (fromDate) {
      match.expenseDate.$gte = new Date(fromDate);
    }

    if (toDate) {
      match.expenseDate.$lte = new Date(toDate);
    }
  }

  const summary = await Expense.aggregate([
    {
      $match: match,
    },

    {
      $group: {
        _id: null,

        totalExpense: {
          $sum: "$totalAmount",
        },

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  success(
    res,
    "Expense summary",
    summary[0] || {
      totalExpense: 0,
      count: 0,
    },
  );
});
