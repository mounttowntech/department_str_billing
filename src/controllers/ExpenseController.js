const mongoose = require("mongoose");
const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");
const Expense = require("../models/Expense");

/* ======================================================
   1. CREATE EXPENSE
====================================================== */
exports.createExpense = asyncHandler(async (req, res) => {
  const createdBy =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.createdBy;

  if (!createdBy) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user not found. Please log in again.",
    });
  }

  const { expenseNumber, store, amount, taxAmount } = req.body;

  if (!expenseNumber) {
    return res.status(400).json({
      success: false,
      message: "Expense number is required.",
    });
  }

  if (!store) {
    return res.status(400).json({
      success: false,
      message: "Store selection is required.",
    });
  }

  if (amount === undefined || Number(amount) < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid expense amount is required.",
    });
  }

  const existing = await Expense.findOne({
    expenseNumber: expenseNumber.trim().toUpperCase(),
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Expense number already exists.",
    });
  }

  const totalAmount = Number(amount || 0) + Number(taxAmount || 0);

  const expense = await Expense.create({
    ...req.body,
    expenseNumber: expenseNumber.trim().toUpperCase(),
    totalAmount,
    createdBy,
  });

  return success(res, "Expense created successfully.", expense, 201);
});

/* ======================================================
   2. GET ALL EXPENSES
====================================================== */
exports.getAllExpense = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
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

  if (status !== undefined && status !== "") {
    filter.status = status === "true" || status === true;
  }

  if (store) {
    filter.store = store;
  }

  if (supplier) {
    filter.supplier = supplier;
  }

  if (approvalStatus) {
    filter.approvalStatus = approvalStatus;
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

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
    .populate("createdBy", "firstName lastName name email")
    .populate("updatedBy", "firstName lastName name email")
    .populate("approvedBy", "firstName lastName name email")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return success(res, "Expense list", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)) || 1,
    data: expenses,
  });
});

/* ======================================================
   3. GET EXPENSE BY ID
====================================================== */
exports.getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id)
    .populate("store")
    .populate("supplier")
    .populate("payment")
    .populate("taxSetting")
    .populate("createdBy", "firstName lastName name email")
    .populate("updatedBy", "firstName lastName name email")
    .populate("approvedBy", "firstName lastName name email");

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found.",
    });
  }

  return success(res, "Expense details", expense);
});

/* ======================================================
   4. UPDATE EXPENSE
====================================================== */
exports.updateExpense = asyncHandler(async (req, res) => {
  const updatedBy =
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    req.body.updatedBy;

  if (req.body.expenseNumber) {
    req.body.expenseNumber = req.body.expenseNumber.trim().toUpperCase();
  }

  if (req.body.amount !== undefined || req.body.taxAmount !== undefined) {
    const existing = await Expense.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    const base =
      req.body.amount !== undefined
        ? Number(req.body.amount)
        : existing.amount;
    const tax =
      req.body.taxAmount !== undefined
        ? Number(req.body.taxAmount)
        : existing.taxAmount;

    req.body.totalAmount = base + tax;
  }

  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      updatedBy,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found.",
    });
  }

  return success(res, "Expense updated successfully", expense);
});

/* ======================================================
   5. PERMANENT DELETE EXPENSE
====================================================== */
exports.deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findByIdAndDelete(req.params.id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found.",
    });
  }

  return success(res, "Expense deleted successfully.");
});

/* ======================================================
   6. APPROVE EXPENSE
====================================================== */
exports.approveExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found.",
    });
  }

  expense.approvalStatus = "Approved";
  expense.approvedBy =
    req.user?._id || req.user?.id || req.user?.userId;
  expense.approvedAt = new Date();

  await expense.save();

  return success(res, "Expense approved successfully", expense);
});

/* ======================================================
   7. REJECT EXPENSE
====================================================== */
exports.rejectExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: "Expense not found.",
    });
  }

  expense.approvalStatus = "Rejected";
  expense.approvedBy =
    req.user?._id || req.user?.id || req.user?.userId;
  expense.approvedAt = new Date();

  await expense.save();

  return success(res, "Expense rejected successfully", expense);
});

/* ======================================================
   8. EXPENSE SUMMARY REPORT
====================================================== */
exports.getExpenseSummary = asyncHandler(async (req, res) => {
  const { store, fromDate, toDate } = req.query;

  const match = { status: true };

  if (store) {
    match.store = new mongoose.Types.ObjectId(store);
  }

  if (fromDate || toDate) {
    match.expenseDate = {};
    if (fromDate) {
      match.expenseDate.$gte = new Date(fromDate);
    }
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      match.expenseDate.$lte = endDate;
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

  return success(
    res,
    "Expense summary",
    summary[0] || {
      totalExpense: 0,
      count: 0,
    }
  );
});