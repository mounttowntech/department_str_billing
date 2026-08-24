const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/responseHandler");
const success = response.success;

const LoyaltyPoints = require("../models/LoyaltyPoints");
const Customer = require("../models/Customer");
const SalesInvoice = require("../models/SalesInvoice");

exports.createLoyaltyPoints = asyncHandler(async (req, res) => {
  const { customer, invoice, points, type, remarks, store, expiryDate } = req.body;

  const createdBy = req.user?._id || req.body.createdBy;

  // Validation
  if (!customer) {
    return res.status(400).json({
      success: false,
      message: "Customer is required.",
    });
  }

  if (!store) {
    return res.status(400).json({
      success: false,
      message: "Store is required.",
    });
  }

  if (!points || points <= 0) {
    return res.status(400).json({
      success: false,
      message: "Points must be greater than zero.",
    });
  }

  if (!type) {
    return res.status(400).json({
      success: false,
      message: "Transaction type is required.",
    });
  }

  // Check Customer
  const customerExists = await Customer.findById(customer);

  if (!customerExists) {
    return res.status(404).json({
      success: false,
      message: "Customer not found.",
    });
  }

  // Check Invoice (Optional)
  let invoiceData = null;

  if (invoice) {
    invoiceData = await SalesInvoice.findById(invoice);

    if (!invoiceData) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    // Prevent duplicate earn entry for same invoice
    if (type === "earn") {
      const alreadyExists = await LoyaltyPoints.findOne({
        invoice,
        type: "earn",
      });

      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: "Loyalty points already generated for this invoice.",
        });
      }
    }
  }

  // Calculate Customer Balance from history
  const history = await LoyaltyPoints.find({ customer });

  let availablePoints = 0;

  history.forEach((item) => {
    if (item.type === "earn" || item.type === "adjust") {
      availablePoints += item.points;
    }

    if (item.type === "redeem") {
      availablePoints -= item.points;
    }
  });

  if (type === "redeem" && availablePoints < points) {
    return res.status(400).json({
      success: false,
      message: "Insufficient loyalty points.",
    });
  }

  let balanceAfterTransaction = availablePoints;

  if (type === "earn" || type === "adjust") {
    balanceAfterTransaction += points;
  } else if (type === "redeem") {
    balanceAfterTransaction -= points;
  }

  const loyalty = await LoyaltyPoints.create({
    customer,
    invoice,
    invoiceNo: invoiceData?.invoiceNo || "",
    points,
    type,
    remarks,
    store,
    createdBy,
    expiryDate: expiryDate || undefined, // <-- Expiry Date Saved Here
    balanceAfterTransaction,
  });

  // --- SYNC WITH CUSTOMER MODULE ---
  let customerPointChange = Number(points);
  if (type === "redeem") {
    customerPointChange = -customerPointChange;
  }

  await Customer.findByIdAndUpdate(customer, {
    $inc: { loyaltyPoints: customerPointChange },
  });
  // ---------------------------------

  success(res, "Loyalty points created successfully.", loyalty, 201);
});

exports.getAllLoyaltyPoints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    customer,
    type,
    store,
    search,
    fromDate,
    toDate,
  } = req.query;

  const filter = {};

  if (customer) {
    filter.customer = customer;
  }

  if (type) {
    filter.type = type;
  }

  if (store) {
    filter.store = store;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};

    if (fromDate) {
      filter.createdAt.$gte = new Date(fromDate);
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);

      filter.createdAt.$lte = endDate;
    }
  }

  if (search) {
    const customers = await Customer.find({
      $or: [
        {
          customerName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          mobileNumber: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    }).select("_id");

    filter.customer = {
      $in: customers.map((c) => c._id),
    };
  }

  const total = await LoyaltyPoints.countDocuments(filter);

  const loyaltyPoints = await LoyaltyPoints.find(filter)
    .populate("customer", "customerName mobileNumber")
    .populate("invoice", "invoiceNo grandTotal")
    .populate("store", "storeName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName")
    .sort({
      createdAt: -1,
    })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  success(res, "Loyalty Points List", {
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
    data: loyaltyPoints,
  });
});

exports.getLoyaltyPointsById = asyncHandler(async (req, res) => {
  const loyalty = await LoyaltyPoints.findById(req.params.id)
    .populate("customer", "customerName mobileNumber email")
    .populate("invoice", "invoiceNo grandTotal invoiceDate")
    .populate("store", "storeName")
    .populate("createdBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

  if (!loyalty) {
    return res.status(404).json({
      success: false,
      message: "Loyalty points record not found.",
    });
  }

  success(res, "Loyalty points details.", loyalty);
});

exports.updateLoyaltyPoints = asyncHandler(async (req, res) => {
  const { customer, invoice, points, type, remarks, store, expiryDate } = req.body;

  const updatedBy = req.user?._id || req.body.updatedBy;

  const loyalty = await LoyaltyPoints.findById(req.params.id);

  if (!loyalty) {
    return res.status(404).json({
      success: false,
      message: "Loyalty points record not found.",
    });
  }

  // --- REVERSE OLD TRANSACTION IMPACT ON CUSTOMER ---
  let oldPointImpact = loyalty.points;
  if (loyalty.type === "redeem") oldPointImpact = -oldPointImpact;

  await Customer.findByIdAndUpdate(loyalty.customer, {
    $inc: { loyaltyPoints: -oldPointImpact },
  });
  // --------------------------------------------------

  if (customer) {
    const customerExists = await Customer.findById(customer);

    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    loyalty.customer = customer;
  }

  if (invoice) {
    const invoiceExists = await SalesInvoice.findById(invoice);

    if (!invoiceExists) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    loyalty.invoice = invoice;
  }

  if (points !== undefined) loyalty.points = points;

  if (type) loyalty.type = type;

  if (remarks !== undefined) loyalty.remarks = remarks;

  if (store) loyalty.store = store;

  if (expiryDate !== undefined) loyalty.expiryDate = expiryDate || null; // <-- Expiry Date Updated Here

  loyalty.updatedBy = updatedBy;

  await loyalty.save();

  // --- APPLY NEW TRANSACTION IMPACT ON CUSTOMER ---
  let newPointImpact = loyalty.points;
  if (loyalty.type === "redeem") newPointImpact = -newPointImpact;

  await Customer.findByIdAndUpdate(loyalty.customer, {
    $inc: { loyaltyPoints: newPointImpact },
  });
  // ------------------------------------------------

  success(res, "Loyalty points updated successfully.", loyalty);
});

exports.deleteLoyaltyPoints = asyncHandler(async (req, res) => {
  const loyalty = await LoyaltyPoints.findById(req.params.id);

  if (!loyalty) {
    return res.status(404).json({
      success: false,
      message: "Loyalty points record not found.",
    });
  }

  // --- REVERSE TRANSACTION FROM CUSTOMER PROFILE ---
  let pointReverse = loyalty.points;
  if (loyalty.type === "earn" || loyalty.type === "adjust") {
    pointReverse = -pointReverse;
  } else if (loyalty.type === "redeem") {
    pointReverse = Math.abs(pointReverse);
  }

  await Customer.findByIdAndUpdate(loyalty.customer, {
    $inc: { loyaltyPoints: pointReverse },
  });
  // -------------------------------------------------

  await loyalty.deleteOne();

  success(res, "Loyalty points deleted successfully.");
});

// --- ONE-TIME SYNC UTILITY METHOD TO FIX EXISTING CUSTOMER BALANCES ---
exports.syncCustomerLoyaltyPoints = asyncHandler(async (req, res) => {
  const customers = await Customer.find({});
  
  for (const cust of customers) {
    const history = await LoyaltyPoints.find({ customer: cust._id });
    let totalPoints = 0;
    
    history.forEach((item) => {
      const pts = Number(item.points || 0);
      if (item.type === "earn" || item.type === "adjust") {
        totalPoints += pts;
      } else if (item.type === "redeem") {
        totalPoints -= pts;
      }
    });

    await Customer.findByIdAndUpdate(cust._id, { 
      loyaltyPoints: Math.max(0, totalPoints) 
    });
  }

  success(res, "All customer loyalty balances synchronized successfully.");
});