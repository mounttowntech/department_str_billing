const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const Store = require("../models/Store");
const SalesInvoice = require("../models/SalesInvoice");
const Purchase = require("../models/Purchase");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Expense = require("../models/Expense");



exports.createPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /* ==========================================
       Read Request Body
    ========================================== */

    const {
      paymentType,
      paymentMode,
      referenceNumber,
      invoice,
      purchase,
      expense,
      customer,
      supplier,
      amount,
      paidAmount,
      transactionDate,
      bankDetails,
      remarks,
      store,
    } = req.body;

    /* ==========================================
       Required Field Validation
    ========================================== */

    if (!paymentType) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Payment Type is required",
      });
    }

    if (!paymentMode) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Payment Mode is required",
      });
    }

    if (!store) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Store is required",
      });
    }

    if (amount === undefined || amount === null) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    if (paidAmount === undefined || paidAmount === null) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Paid Amount is required",
      });
    }

    if (Number(amount) <= 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    if (Number(paidAmount) < 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Paid Amount cannot be negative",
      });
    }

    if (Number(paidAmount) > Number(amount)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Paid Amount cannot be greater than Amount",
      });
    }

    /* ==========================================
       Validate Store
    ========================================== */

    const storeData = await Store.findById(store).session(session);

    if (!storeData) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    /* ==========================================
       Validate Sales Invoice
    ========================================== */

    if (paymentType === "Sales") {
      if (!invoice) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: "Sales Invoice is required",
        });
      }

      const invoiceData = await SalesInvoice.findById(invoice).session(session);

      if (!invoiceData) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Sales Invoice not found",
        });
      }
    }

    /* ==========================================
       Validate Purchase
    ========================================== */

    if (paymentType === "Purchase") {
      if (!purchase) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: "Purchase is required",
        });
      }

      const purchaseData = await Purchase.findById(purchase).session(session);

      if (!purchaseData) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }
    }

    /* ==========================================
       Validate Customer
    ========================================== */

    if (
      paymentType === "Sales" ||
      paymentType === "Customer Payment" ||
      paymentType === "Advance" ||
      paymentType === "Refund"
    ) {
      if (customer) {
        const customerData = await Customer.findById(customer).session(session);

        if (!customerData) {
          await session.abortTransaction();
          session.endSession();

          return res.status(404).json({
            success: false,
            message: "Customer not found",
          });
        }
      }
    }

    /* ==========================================
       Validate Supplier
    ========================================== */

    if (paymentType === "Purchase" || paymentType === "Supplier Payment") {
      if (!supplier) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: "Supplier is required",
        });
      }

      const supplierData = await Supplier.findById(supplier).session(session);

      if (!supplierData) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Supplier not found",
        });
      }
    }

    if (paymentType === "Expense") {
      if (!expense) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: "Expense is required",
        });
      }

      const expenseData = await Expense.findById(expense).session(session);

      if (!expenseData) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Expense not found",
        });
      }
    }

    const payment = await Payment.create(
      [
        {
          paymentType,
          paymentMode,
          referenceNumber,
          invoice,
          purchase,
          expense,
          customer,
          supplier,
          amount,
          paidAmount,
          transactionDate,
          bankDetails,
          remarks,
          store,
          createdBy: req.user?._id || req.user?.id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    /* ==========================================
       Populate Created Payment
       ------------------------------------------
       Isolated in its own try/catch: the Payment record is already
       committed at this point, so a populate failure here shouldn't
       turn into a 500 for data that already saved successfully.

       "items" is included in the invoice select because a virtual on
       the SalesInvoice model (around line 376) reads a field — likely
       `this.items.length` — that isn't selected here by default,
       causing a crash during JSON serialization. This is the same
       issue hit in the Sales Return controllers. The permanent fix is
       to guard that virtual directly in SalesInvoice.js.
    ========================================== */

    try {
      const result = await Payment.findById(payment[0]._id)
        .populate("invoice", "invoiceNo grandTotal paymentStatus items")
        .populate("purchase", "purchaseNo grandTotal paymentStatus")
        .populate("expense", "expenseNumber expenseTitle amount")
        .populate("customer", "customerCode customerName phone")
        .populate("supplier", "supplierCode supplierName phone")
        .populate("store", "storeCode storeName")
        .populate("createdBy", "firstName lastName");

      return res.status(201).json({
        success: true,
        message: "Payment created successfully",
        data: result,
      });
    } catch (populateError) {
      console.error("Payment created, but populate failed:", populateError);

      return res.status(201).json({
        success: true,
        message: "Payment created successfully (response population failed)",
        data: payment[0],
      });
    }
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error("Create Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 10,
      search,
      paymentType,
      paymentMode,
      paymentStatus,
      customer,
      supplier,
      invoice,
      purchase,
      expense,
      store,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    /* ==========================================
       Filter
    ========================================== */

    const filter = {
      isDeleted: false,
    };

    if (paymentType)
      filter.paymentType = paymentType;

    if (paymentMode)
      filter.paymentMode = paymentMode;

    if (paymentStatus)
      filter.paymentStatus = paymentStatus;

    if (customer)
      filter.customer = customer;

    if (supplier)
      filter.supplier = supplier;

    if (invoice)
      filter.invoice = invoice;

    if (purchase)
      filter.purchase = purchase;

    if (expense)
      filter.expense = expense;

    if (store)
      filter.store = store;

    /* ==========================================
       Search
    ========================================== */

    if (search) {

      filter.$or = [
        {
          paymentNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          referenceNumber: {
            $regex: search,
            $options: "i",
          },
        },
      ];

    }

    /* ==========================================
       Date Filter
    ========================================== */

    if (fromDate || toDate) {

      filter.transactionDate = {};

      if (fromDate)
        filter.transactionDate.$gte = new Date(fromDate);

      if (toDate)
        filter.transactionDate.$lte = new Date(toDate);

    }

    /* ==========================================
       Pagination
    ========================================== */

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);

    const skip = (pageNumber - 1) * pageSize;

    /* ==========================================
       Sorting
    ========================================== */

    const sort = {
      [sortBy]:
        sortOrder === "asc" ? 1 : -1,
    };

    /* ==========================================
       Fetch Payments
       ------------------------------------------
       "items" is included in the invoice select below because a
       virtual on the SalesInvoice model (around line 376) reads a
       field — most likely `this.items.length` — that isn't selected
       here by default, causing a crash during JSON serialization.
       This is the same bug hit across every other controller that
       populates "invoice" with a restricted select (Sales Return
       create/update/list/getById, Payment create). The permanent fix
       is to guard that virtual directly in SalesInvoice.js, or apply
       the generic virtual safety-net wrapper already provided.
    ========================================== */

    const payments = await Payment.find(filter)
      .populate(
        "invoice",
        "invoiceNo grandTotal items"
      )
      .populate(
        "purchase",
        "purchaseNo grandTotal"
      )
      .populate(
        "expense",
        "expenseNumber expenseTitle"
      )
      .populate(
        "customer",
        "customerCode customerName"
      )
      .populate(
        "supplier",
        "supplierCode supplierName"
      )
      .populate(
        "store",
        "storeCode storeName"
      )
      .populate(
        "createdBy",
        "firstName lastName"
      )
      .sort(sort)
      .skip(skip)
      .limit(pageSize);

    /* ==========================================
       Count
    ========================================== */

    const totalRecords =
      await Payment.countDocuments(filter);

    const totalPages = Math.ceil(
      totalRecords / pageSize
    );

    /* ==========================================
       Response
    ========================================== */

    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully",

      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalRecords,
        pageSize,
        hasNextPage:
          pageNumber < totalPages,
        hasPrevPage:
          pageNumber > 1,
      },

      data: payments,
    });

  } catch (error) {

    console.error(
      "Get Payments Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
/* ==========================================
   Get Payment By ID
========================================== */

exports.getPaymentById = async (req, res) => {
  try {

    // "items" is included in the invoice select below because a
    // virtual on the SalesInvoice model (around line 376) reads a
    // field — most likely `this.items.length` — that isn't selected
    // here by default, causing a crash during JSON serialization.
    // Same bug hit across every other controller that populates
    // "invoice" with a restricted select.
    const payment = await Payment.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate(
        "invoice",
        "invoiceNo grandTotal paymentStatus items"
      )
      .populate(
        "purchase",
        "purchaseNo grandTotal paymentStatus"
      )
      .populate(
        "expense",
        "expenseNumber expenseTitle amount"
      )
      .populate(
        "customer",
        "customerCode customerName phone email"
      )
      .populate(
        "supplier",
        "supplierCode supplierName phone email"
      )
      .populate(
        "store",
        "storeCode storeName"
      )
      .populate(
        "createdBy",
        "firstName lastName"
      )
      .populate(
        "updatedBy",
        "firstName lastName"
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });

  } catch (error) {

    console.error("Get Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
/* ==========================================
   Update Payment
========================================== */

exports.updatePayment = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const payment = await Payment.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);

    if (!payment) {

      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });

    }

    Object.assign(payment, req.body);

    payment.updatedBy =
      req.user?._id || req.user?.id;

    await payment.save({ session });

    await session.commitTransaction();

    session.endSession();

    const result = await Payment.findById(payment._id)
      .populate(
        "invoice",
        "invoiceNo grandTotal"
      )
      .populate(
        "purchase",
        "purchaseNo grandTotal"
      )
      .populate(
        "expense",
        "expenseNumber expenseTitle"
      )
      .populate(
        "customer",
        "customerCode customerName"
      )
      .populate(
        "supplier",
        "supplierCode supplierName"
      )
      .populate(
        "store",
        "storeCode storeName"
      )
      .populate(
        "createdBy",
        "firstName lastName"
      )
      .populate(
        "updatedBy",
        "firstName lastName"
      );

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: result,
    });

  } catch (error) {

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error("Update Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

/* ==========================================
   Delete Payment (Soft Delete)
========================================== */

exports.deletePayment = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const payment = await Payment.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);

    if (!payment) {

      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });

    }

    payment.isDeleted = true;

    payment.updatedBy =
      req.user?._id || req.user?.id;

    await payment.save({ session });

    await session.commitTransaction();

    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });

  } catch (error) {

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error("Delete Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};