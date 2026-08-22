const response = require("../utils/responseHandler");
const asyncHandler = require("../utils/asyncHandler");
const CashSession = require("../models/CashSession");

const success = response.success;

// ======================================================
// CREATE CASH SESSION
// ======================================================
exports.createCashSession = asyncHandler(async (req, res) => {
  const {
    sessionNo,
    store,
    cashier,
    openingBalance,
    closingBalance,
    cashSales,
    expenseCash,
    status,
    notes,
  } = req.body;

  // ----------------------------------------------------
  // Field Validation
  // ----------------------------------------------------
  if (!sessionNo || !sessionNo.trim()) {
    return res.status(400).json({
      success: false,
      message: "Session No is required",
    });
  }

  if (!store) {
    return res.status(400).json({
      success: false,
      message: "Store is required",
    });
  }

  if (!cashier || !String(cashier).trim()) {
    return res.status(400).json({
      success: false,
      message: "Cashier ID / Number is required",
    });
  }

  // ----------------------------------------------------
  // Unique Session Number Check
  // ----------------------------------------------------
  const existingSession = await CashSession.findOne({
    sessionNo: sessionNo.trim(),
  });

  if (existingSession) {
    return res.status(400).json({
      success: false,
      message: "Session No already exists",
    });
  }

  // ----------------------------------------------------
  // Check Existing Open Session (Same Store + Cashier)
  // ----------------------------------------------------
  const existingOpen = await CashSession.findOne({
    store,
    cashier: String(cashier).trim(),
    status: "open",
  });

  if (existingOpen) {
    return res.status(400).json({
      success: false,
      message:
        "An open cash session already exists for this cashier at this store",
    });
  }

  // ----------------------------------------------------
  // Balance & Calculation
  // ----------------------------------------------------
  const opening = Number(openingBalance || 0);
  const sales = Number(cashSales || 0);
  const expense = Number(expenseCash || 0);
  const closing = Number(closingBalance || 0);

  const expectedClosing = opening + sales - expense;
  const difference = closing - expectedClosing;

  // ----------------------------------------------------
  // Create Record
  // ----------------------------------------------------
  const newSession = await CashSession.create({
    sessionNo: sessionNo.trim(),
    store,
    cashier: String(cashier).trim(),
    openingBalance: opening,
    closingBalance: closing,
    expectedClosingBalance: status === "closed" ? expectedClosing : 0,
    difference: status === "closed" ? difference : 0,
    cashSales: sales,
    expenseCash: expense,
    status: status || "open",
    openedAt: new Date(),
    closedAt: status === "closed" ? new Date() : undefined,
    notes: notes?.trim() || "",
    createdBy: req.user?._id,
  });

  const populatedData = await CashSession.findById(newSession._id).populate(
    "store",
    "storeName name"
  );

  return success(res, "Cash session created successfully", populatedData, 201);
});

// ======================================================
// GET ALL CASH SESSIONS
// ======================================================
exports.getAllCashSession = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.store) {
    filter.store = req.query.store;
  }

  if (req.query.cashier) {
    filter.cashier = req.query.cashier;
  }

  const data = await CashSession.find(filter)
    .populate("store", "storeName name")
    .sort({ createdAt: -1 });

  return success(res, "Cash session list retrieved", data);
});

// ======================================================
// GET CASH SESSION BY ID
// ======================================================
exports.getCashSessionById = asyncHandler(async (req, res) => {
  const data = await CashSession.findById(req.params.id).populate(
    "store",
    "storeName name"
  );

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Cash session not found",
    });
  }

  return success(res, "Cash session details retrieved", data);
});

// ======================================================
// UPDATE CASH SESSION
// ======================================================
exports.updateCashSession = asyncHandler(async (req, res) => {
  const existing = await CashSession.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Cash session not found",
    });
  }

  // ----------------------------------------------------
  // Guard: Closed Sessions Are Locked for Audit
  // ----------------------------------------------------
  if (existing.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "Cannot modify a closed cash session",
    });
  }

  const opening = Number(
    req.body.openingBalance ?? existing.openingBalance ?? 0
  );
  const sales = Number(
    req.body.cashSales ?? existing.cashSales ?? 0
  );
  const expense = Number(
    req.body.expenseCash ?? existing.expenseCash ?? 0
  );
  const closing = Number(
    req.body.closingBalance ?? existing.closingBalance ?? 0
  );

  const expectedClosing = opening + sales - expense;
  const difference = closing - expectedClosing;

  const payload = {
    ...req.body,
    cashier:
      req.body.cashier !== undefined
        ? String(req.body.cashier).trim()
        : existing.cashier,
    openingBalance: opening,
    closingBalance: closing,
    cashSales: sales,
    expenseCash: expense,
    updatedBy: req.user?._id,
  };

  // ----------------------------------------------------
  // Session Closing Calculations
  // ----------------------------------------------------
  if (req.body.status === "closed") {
    payload.expectedClosingBalance = expectedClosing;
    payload.difference = difference;
    payload.closedAt = new Date();
  }

  // ----------------------------------------------------
  // Prevent Reassignment Conflicts
  // ----------------------------------------------------
  if (
    req.body.status === "open" &&
    (req.body.store !== undefined || req.body.cashier !== undefined)
  ) {
    const checkStore = req.body.store || existing.store;
    const checkCashier =
      req.body.cashier !== undefined
        ? String(req.body.cashier).trim()
        : existing.cashier;

    const duplicate = await CashSession.findOne({
      _id: { $ne: existing._id },
      store: checkStore,
      cashier: checkCashier,
      status: "open",
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message:
          "An open cash session already exists for this cashier at this store",
      });
    }
  }

  const updatedData = await CashSession.findByIdAndUpdate(
    req.params.id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  ).populate("store", "storeName name");

  return success(res, "Cash session updated successfully", updatedData);
});

// ======================================================
// DELETE CASH SESSION
// ======================================================
exports.deleteCashSession = asyncHandler(async (req, res) => {
  const existing = await CashSession.findById(req.params.id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Cash session not found",
    });
  }

  if (existing.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "Closed cash sessions cannot be deleted (audit record)",
    });
  }

  await CashSession.findByIdAndDelete(req.params.id);

  return success(res, "Cash session deleted successfully");
});