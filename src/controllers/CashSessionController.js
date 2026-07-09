const response = require("../utils/responseHandler");
const success = response.success;
const asyncHandler = require("../utils/asyncHandler");
const Model = require("../models/CashSession");

exports.createCashSession = asyncHandler(async (req, res) => {
  const existingOpen = await Model.findOne({
    store: req.body.store,
    cashier: req.body.cashier,
    status: "open",
  });
  if (existingOpen) {
    return res.status(400).json({
      success: false,
      message: "An open cash session already exists for this cashier at this store",
    });
  }

  const data = await Model.create({ ...req.body, createdBy: req.user?._id });
  success(res, "CashSession created", data, 201);
});

exports.getAllCashSession = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.store) filter.store = req.query.store;
  if (req.query.cashier) filter.cashier = req.query.cashier;

  const data = await Model.find(filter)
    .populate("store", "name")
    .populate("cashier", "name email")
    .sort({ createdAt: -1 });

  success(res, "CashSession list", data);
});

exports.getCashSessionById = asyncHandler(async (req, res) => {
  const data = await Model.findById(req.params.id)
    .populate("store", "name")
    .populate("cashier", "name email");
  if (!data)
    return res.status(404).json({ success: false, message: "CashSession not found" });
  success(res, "CashSession details", data);
});

exports.updateCashSession = asyncHandler(async (req, res) => {
  const existing = await Model.findById(req.params.id);
  if (!existing)
    return res.status(404).json({ success: false, message: "CashSession not found" });

  if (existing.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "Cannot modify a closed cash session",
    });
  }

  const payload = { ...req.body, updatedBy: req.user?._id };

  // Auto-handle closing logic
  if (req.body.status === "closed") {
    const expected =
      (req.body.openingBalance ?? existing.openingBalance) +
      (req.body.cashSales ?? existing.cashSales) -
      (req.body.expenseCash ?? existing.expenseCash);

    payload.expectedClosingBalance = expected;
    payload.difference = (req.body.closingBalance ?? existing.closingBalance) - expected;
    payload.closedAt = new Date();
  }

  const data = await Model.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  success(res, "CashSession updated", data);
});

exports.deleteCashSession = asyncHandler(async (req, res) => {
  const existing = await Model.findById(req.params.id);
  if (!existing)
    return res.status(404).json({ success: false, message: "CashSession not found" });

  if (existing.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "Closed cash sessions cannot be deleted (audit record)",
    });
  }

  await Model.findByIdAndDelete(req.params.id);
  success(res, "CashSession deleted");
});