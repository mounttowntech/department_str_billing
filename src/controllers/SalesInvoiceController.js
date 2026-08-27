const mongoose = require("mongoose");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Coupon = require("../models/Coupon");
const Offer = require("../models/Offer");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const Batch = require("../models/Batch");

exports.createSalesInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      invoiceNo,
      customer,
      store,
      warehouse,
      couponCode,
      couponAmount,
      invoiceDate,
      billingType,
      customerType,
      paymentMethod,
      paidAmount,
      remarks,
      items,
    } = req.body;

    // ==========================
    // Duplicate Invoice
    // ==========================
    const invoiceExists = await SalesInvoice.findOne({
      invoiceNo,
      isDeleted: false,
    }).session(session);

    if (invoiceExists) {
      throw new Error("Invoice Number already exists");
    }

    // ==========================
    // Customer Validation
    // ==========================
    if (customer) {
      const customerExists = await Customer.findById(customer).session(session);
      if (!customerExists) {
        throw new Error("Customer not found");
      }
    }

    // ==========================
    // Items Validation
    // ==========================
    if (!items || items.length === 0) {
      throw new Error("Invoice items are required");
    }

    // ==========================
    // Validate Products & Stock
    // ==========================
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product not found : ${item.product}`);
      }
      if (product.totalStock < Number(item.quantity)) {
        throw new Error(`${product.productName} stock not available`);
      }

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(session);
        if (!variant) {
          throw new Error(`Variant not found : ${item.variant}`);
        }
        if (variant.currentStock < Number(item.quantity)) {
          throw new Error(`${variant.variantName} stock not available`);
        }
      }

      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);
        if (!batch) {
          throw new Error(`Batch not found : ${item.batch}`);
        }
        if (batch.remainingQuantity < Number(item.quantity)) {
          throw new Error(`Batch stock not available`);
        }
      }
    }

    // ==========================
    // Coupon / Offer Verification & Lookup
    // ==========================
    let couponId = null;
    let appliedCoupon = null;

    if (couponCode) {
      const normalizedCode = couponCode.trim().toUpperCase();

      // 1. Try finding a physical Coupon first
      appliedCoupon = await Coupon.findOne({
        couponCode: normalizedCode,
      }).session(session);

      if (appliedCoupon) {
        if (!appliedCoupon.status) {
          throw new Error("Coupon is inactive");
        }

        const now = new Date();
        if (appliedCoupon.endDate && now > new Date(appliedCoupon.endDate)) {
          throw new Error("Coupon has expired");
        }

        const usageLimit = Number(appliedCoupon.usageLimit || 0);
        const usedCount = Number(appliedCoupon.usedCount || 0);

        if (usageLimit > 0 && usedCount >= usageLimit) {
          throw new Error("Coupon usage limit has been reached");
        }

        couponId = appliedCoupon._id;
      } else {
        // 2. If not a coupon, check if it's an automated Offer name/campaign
        const matchedOffer = await Offer.findOne({
          $or: [
            { offerName: { $regex: new RegExp(`^${couponCode.trim()}$`, "i") } },
            { offerCode: normalizedCode }
          ],
          status: true
        }).session(session);

        if (!matchedOffer) {
          throw new Error("Invalid coupon code or offer name");
        }
        // Offers bypass strict coupon ID tracking, allowing the calculated discount to pass through safely
      }
    }

    // ==========================
    // Create Invoice
    // ==========================
    const salesInvoice = new SalesInvoice({
      invoiceNo,
      customer,
      store,
      warehouse,
      coupon: couponId,
      couponCode: couponCode ? couponCode.toUpperCase() : undefined,
      couponAmount: Number(couponAmount || 0),
      invoiceDate,
      billingType,
      customerType,
      paymentMethod,
      paidAmount,
      remarks,
      items,
      createdBy: req.user?._id || req.user?.id,
    });

    await salesInvoice.save({ session });

    // ==========================
    // Increase Coupon Used Count
    // ==========================
    if (appliedCoupon) {
      const updatedCoupon = await Coupon.findOneAndUpdate(
        {
          _id: appliedCoupon._id,
          $expr: {
            $lt: ["$usedCount", "$usageLimit"],
          },
        },
        {
          $inc: {
            usedCount: 1,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedCoupon) {
        throw new Error("Coupon usage limit has been reached");
      }
    }

    // ==========================
    // Deduct Stock
    // ==========================
    for (const item of salesInvoice.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { totalStock: -Number(item.quantity) } },
        { session }
      );

      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(
          item.variant,
          { $inc: { currentStock: -Number(item.quantity) } },
          { session }
        );
      }

      if (item.batch) {
        await Batch.findByIdAndUpdate(
          item.batch,
          { $inc: { remainingQuantity: -Number(item.quantity) } },
          { session }
        );
      }
    }

    // ==========================
    // Sync Customer Due Amount
    // ==========================
    if (customer) {
      const grandTotal = Number(salesInvoice.grandTotal || 0);
      const paid = Number(paidAmount || 0);
      const pendingDue = grandTotal - paid;

      if (pendingDue > 0) {
        await Customer.findByIdAndUpdate(
          customer,
          { $inc: { dueAmount: pendingDue } },
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    const result = await SalesInvoice.findById(salesInvoice._id)
      .populate("customer", "customerName customerCode mobile email")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("coupon", "couponCode discountValue")
      .populate("payment", "paymentNo paymentMethod paymentStatus")
      .populate("createdBy", "firstName lastName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "variantName skuCode barcode")
      .populate("items.batch", "batchNumber batchCode")
      .populate("items.unit", "unitName shortName");

    return res.status(201).json({
      success: true,
      message: "Sales Invoice created successfully",
      data: result,
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Create Sales Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSalesInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      store,
      warehouse,
      customer,
      paymentStatus,
      paymentMethod,
      billingType,
      customerType,
      fromDate,
      toDate,
      invoiceNo,
    } = req.query;

    const filter = { isDeleted: false };

    if (invoiceNo) filter.invoiceNo = invoiceNo;
    if (store) filter.store = store;
    if (warehouse) filter.warehouse = warehouse;
    if (customer) filter.customer = customer;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (billingType) filter.billingType = billingType;
    if (customerType) filter.customerType = customerType;

    if (fromDate || toDate) {
      filter.invoiceDate = {};
      if (fromDate) filter.invoiceDate.$gte = new Date(fromDate);
      if (toDate) filter.invoiceDate.$lte = new Date(toDate);
    }

    if (search) {
      filter.$or = [
        { invoiceNo: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalRecords = await SalesInvoice.countDocuments(filter);

    const invoices = await SalesInvoice.find(filter)
      .populate("customer", "customerName customerCode mobile email")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("coupon", "couponCode discountValue")
      .populate("payment", "paymentNumber paymentStatus")
      .populate("createdBy", "firstName lastName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "variantName skuCode barcode")
      .populate("items.batch", "batchNumber")
      .populate("items.unit", "unitName shortName")
      .sort({ invoiceDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      totalRecords,
      currentPage: Number(page),
      totalPages: Math.ceil(totalRecords / limit),
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("Get Sales Invoices Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesInvoiceById = async (req, res) => {
  try {
    const invoice = await SalesInvoice.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("customer")
      .populate("store")
      .populate("warehouse")
      .populate("coupon")
      .populate("payment")
      .populate("createdBy", "firstName lastName email")
      .populate("items.product")
      .populate("items.variant")
      .populate("items.batch")
      .populate("items.unit");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Sales Invoice not found" });
    }

    return res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error("Get Sales Invoice Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSalesInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const invoiceId = req.params.id;
    const invoice = await SalesInvoice.findById(invoiceId).session(session);

    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Sales Invoice not found" });
    }

    const oldCouponId = invoice.coupon;
    const oldCustomer = invoice.customer;
    const oldPendingDue = Math.max(0, Number(invoice.grandTotal || 0) - Number(invoice.paidAmount || 0));

    // Restore previous stock
    for (const item of invoice.items) {
      const product = await Product.findById(item.product).session(session);
      if (product) {
        product.totalStock += Number(item.quantity);
        await product.save({ session });
      }

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(session);
        if (variant) {
          variant.currentStock += Number(item.quantity);
          await variant.save({ session });
        }
      }

      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);
        if (batch) {
          batch.remainingQuantity += Number(item.quantity);
          await batch.save({ session });
        }
      }
    }

    // Coupon / Offer verification on update
    let newCoupon = null;
    if (req.body.couponCode) {
      const normalizedCode = req.body.couponCode.trim().toUpperCase();

      newCoupon = await Coupon.findOne({
        couponCode: normalizedCode,
      }).session(session);

      if (newCoupon) {
        if (!newCoupon.status) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: "Coupon is inactive" });
        }

        const now = new Date();
        if (newCoupon.endDate && now > new Date(newCoupon.endDate)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: "Coupon has expired" });
        }

        const usageLimit = Number(newCoupon.usageLimit || 0);
        const usedCount = Number(newCoupon.usedCount || 0);

        if (usageLimit > 0 && usedCount >= usageLimit) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: "Coupon usage limit has been reached" });
        }
      } else {
        const matchedOffer = await Offer.findOne({
          $or: [
            { offerName: { $regex: new RegExp(`^${req.body.couponCode.trim()}$`, "i") } },
            { offerCode: normalizedCode }
          ],
          status: true
        }).session(session);

        if (!matchedOffer) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: "Invalid coupon code or offer name" });
        }
      }
    }

    if (!req.body.items || req.body.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invoice items are required" });
    }

    // Validate new item stock
    for (const item of req.body.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: `Product not found : ${item.product}` });
      }

      if (product.totalStock < Number(item.quantity)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `${product.productName} has insufficient stock` });
      }
    }

    invoice.invoiceNo = req.body.invoiceNo || invoice.invoiceNo;
    invoice.customer = req.body.customer || null;
    invoice.store = req.body.store;
    invoice.warehouse = req.body.warehouse;
    invoice.invoiceDate = req.body.invoiceDate;
    invoice.coupon = newCoupon ? newCoupon._id : null;
    invoice.couponCode = req.body.couponCode ? req.body.couponCode.toUpperCase() : undefined;
    invoice.couponAmount = Number(req.body.couponAmount || 0);
    invoice.billingType = req.body.billingType;
    invoice.customerType = req.body.customerType;
    invoice.items = req.body.items;
    invoice.discountAmount = Number(req.body.discountAmount || 0);
    invoice.paidAmount = Number(req.body.paidAmount || 0);
    invoice.paymentMethod = req.body.paymentMethod;
    invoice.returnStatus = req.body.returnStatus || invoice.returnStatus || "None";
    invoice.remarks = req.body.remarks || "";
    invoice.updatedBy = req.user?._id || req.user?.id;

    await invoice.save({ session });

    // Handle coupon usage changes
    const oldCouponString = oldCouponId ? oldCouponId.toString() : null;
    const newCouponString = newCoupon ? newCoupon._id.toString() : null;

    if (oldCouponString !== newCouponString) {
      if (oldCouponId) {
        await Coupon.findByIdAndUpdate(
          oldCouponId,
          { $inc: { usedCount: -1 } },
          { session }
        );
      }

      if (newCoupon) {
        const updatedCoupon = await Coupon.findOneAndUpdate(
          {
            _id: newCoupon._id,
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
          },
          { $inc: { usedCount: 1 } },
          { new: true, session }
        );

        if (!updatedCoupon) {
          throw new Error("Coupon usage limit has been reached");
        }
      }
    }

    // Deduct new stock
    for (const item of invoice.items) {
      const product = await Product.findById(item.product).session(session);
      product.totalStock -= Number(item.quantity);
      await product.save({ session });

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(session);
        variant.currentStock -= Number(item.quantity);
        await variant.save({ session });
      }

      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);
        batch.remainingQuantity -= Number(item.quantity);
        await batch.save({ session });
      }
    }

    // Sync customer due amount
    if (oldCustomer && oldPendingDue > 0) {
      await Customer.findByIdAndUpdate(
        oldCustomer,
        { $inc: { dueAmount: -oldPendingDue } },
        { session }
      );
    }

    if (invoice.customer) {
      const newPendingDue = Math.max(0, Number(invoice.grandTotal || 0) - Number(invoice.paidAmount || 0));
      if (newPendingDue > 0) {
        await Customer.findByIdAndUpdate(
          invoice.customer,
          { $inc: { dueAmount: newPendingDue } },
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    const updatedInvoice = await SalesInvoice.findById(invoice._id)
      .populate("customer", "customerName customerCode phone")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("coupon", "couponCode discountValue")
      .populate("payment", "paymentNo paymentMethod paymentStatus")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "variantName skuCode barcode")
      .populate("items.batch", "batchNumber")
      .populate("items.unit", "unitName shortName");

    return res.status(200).json({
      success: true,
      message: "Sales Invoice updated successfully",
      data: updatedInvoice,
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Update Sales Invoice Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSalesInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Invalid Sales Invoice ID" });
    }

    const invoice = await SalesInvoice.findOne({
      _id: id,
      isDeleted: false,
    }).session(session);

    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Sales Invoice not found" });
    }

    for (const item of invoice.items) {
      const quantity = Number(item.quantity);
      if (item.product) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.totalStock += quantity;
          await product.save({ session });
        }
      }
      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(session);
        if (variant) {
          variant.currentStock += quantity;
          await variant.save({ session });
        }
      }
      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);
        if (batch) {
          batch.remainingQuantity += quantity;
          await batch.save({ session });
        }
      }
    }

    // Restore coupon usage count
    if (invoice.coupon) {
      await Coupon.findOneAndUpdate(
        {
          _id: invoice.coupon,
          usedCount: { $gt: 0 },
        },
        {
          $inc: { usedCount: -1 },
        },
        { session }
      );
    }

    if (invoice.customer) {
      const pendingDue = Math.max(0, Number(invoice.grandTotal || 0) - Number(invoice.paidAmount || 0));
      if (pendingDue > 0) {
        await Customer.findByIdAndUpdate(
          invoice.customer,
          { $inc: { dueAmount: -pendingDue } },
          { session }
        );
      }
    }

    const deletedBy = req.user?._id || req.user?.id || null;

    await SalesInvoice.updateOne(
      { _id: invoice._id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
          updatedBy: deletedBy,
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Sales Invoice deleted successfully",
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Delete Sales Invoice Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete" });
  }
};