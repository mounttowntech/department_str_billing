const mongoose = require("mongoose");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Coupon = require("../models/Coupon");
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
      coupon,
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
    // Coupon Validation
    // ==========================

    if (coupon) {
      const couponExists = await Coupon.findById(coupon).session(session);

      if (!couponExists) {
        throw new Error("Coupon not found");
      }
    }

    // ==========================
    // Items Validation
    // ==========================

    if (!items || items.length === 0) {
      throw new Error("Invoice items are required");
    }

    // ==========================
    // Validate Products
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
    // Create Invoice
    // ==========================

    const salesInvoice = new SalesInvoice({
      invoiceNo,
      customer,
      store,
      warehouse,
      coupon,
      invoiceDate,
      billingType,
      customerType,
      paymentMethod,
      paidAmount,
      remarks,
      items,
      createdBy: req.user?._id || req.user?.id,
    });

    // Save

    await salesInvoice.save({ session });

    // ==========================
    // Deduct Stock
    // ==========================

    for (const item of salesInvoice.items) {

      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            totalStock: -Number(item.quantity),
          },
        },
        { session }
      );

      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(
          item.variant,
          {
            $inc: {
              currentStock: -Number(item.quantity),
            },
          },
          { session }
        );
      }

      if (item.batch) {
        await Batch.findByIdAndUpdate(
          item.batch,
          {
            $inc: {
              remainingQuantity: -Number(item.quantity),
            },
          },
          { session }
        );
      }
    }

    // ==========================
    // Commit
    // ==========================

    await session.commitTransaction();
    session.endSession();

    // ==========================
    // Populate
    // ==========================

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

    // Abort ONLY if transaction still active
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

/* ==========================================================
   Get All Sales Invoices
========================================================== */

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

    const filter = {
      isDeleted: false,
    };

    // Invoice Number

    if (invoiceNo) {
      filter.invoiceNo = invoiceNo;
    }

    // Store

    if (store) {
      filter.store = store;
    }

    // Warehouse

    if (warehouse) {
      filter.warehouse = warehouse;
    }

    // Customer

    if (customer) {
      filter.customer = customer;
    }

    // Payment Status

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Payment Method

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Billing Type

    if (billingType) {
      filter.billingType = billingType;
    }

    // Customer Type

    if (customerType) {
      filter.customerType = customerType;
    }

    // Date Filter

    if (fromDate || toDate) {
      filter.invoiceDate = {};

      if (fromDate) {
        filter.invoiceDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.invoiceDate.$lte = new Date(toDate);
      }
    }

    // Search

    if (search) {
      filter.$or = [
        {
          invoiceNo: {
            $regex: search,
            $options: "i",
          },
        },
        {
          remarks: {
            $regex: search,
            $options: "i",
          },
        },
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

      .sort({
        invoiceDate: -1,
        createdAt: -1,
      })

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

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ==========================================================
   Get Sales Invoice By ID
========================================================== */

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
      return res.status(404).json({
        success: false,
        message: "Sales Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Get Sales Invoice Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

      return res.status(404).json({
        success: false,
        message: "Sales Invoice not found",
      });
    }

    /* ===================================================
       RESTORE PREVIOUS STOCK
    ==================================================== */

    for (const item of invoice.items) {
      // Restore Product Stock

      const product = await Product.findById(item.product).session(session);

      if (product) {
        product.totalStock += Number(item.quantity);

        await product.save({ session });
      }

      // Restore Variant Stock

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(
          session,
        );

        if (variant) {
          variant.currentStock += Number(item.quantity);

          await variant.save({ session });
        }
      }

      // Restore Batch Quantity

      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);

        if (batch) {
          batch.remainingQuantity += Number(item.quantity);

          await batch.save({ session });
        }
      }
    }

    /* ===================================================
       VALIDATE NEW ITEMS
    ==================================================== */

    if (!req.body.items || req.body.items.length === 0) {
      await session.abortTransaction();

      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invoice items are required",
      });
    }

    for (const item of req.body.items) {
      /* ---------------- Product ---------------- */

      const product = await Product.findById(item.product).session(session);

      if (!product) {
        await session.abortTransaction();

        session.endSession();

        return res.status(404).json({
          success: false,
          message: `Product not found : ${item.product}`,
        });
      }

      /* ---------------- Variant ---------------- */

      let variant = null;

      if (item.variant) {
        variant = await ProductVariant.findById(item.variant).session(session);

        if (!variant) {
          await session.abortTransaction();

          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Variant not found : ${item.variant}`,
          });
        }
      }

      /* ---------------- Batch ---------------- */

      let batch = null;

      if (item.batch) {
        batch = await Batch.findById(item.batch).session(session);

        if (!batch) {
          await session.abortTransaction();

          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Batch not found : ${item.batch}`,
          });
        }
      }

      /* ---------------- Stock Validation ---------------- */

      if (product.totalStock < Number(item.quantity)) {
        await session.abortTransaction();

        session.endSession();

        return res.status(400).json({
          success: false,
          message: `${product.productName} has only ${product.totalStock} stock available`,
        });
      }

      if (variant) {
        if (variant.currentStock < Number(item.quantity)) {
          await session.abortTransaction();

          session.endSession();

          return res.status(400).json({
            success: false,
            message: `${variant.variantName} has only ${variant.currentStock} stock available`,
          });
        }
      }

      if (batch) {
        if (batch.remainingQuantity < Number(item.quantity)) {
          await session.abortTransaction();

          session.endSession();

          return res.status(400).json({
            success: false,
            message: `Batch ${batch.batchNumber} has only ${batch.remainingQuantity} stock available`,
          });
        }
      }
    }

    /* ===================================================
       UPDATE SALES INVOICE
    ==================================================== */

    invoice.invoiceNo = req.body.invoiceNo || invoice.invoiceNo;

    invoice.customer = req.body.customer || null;

    invoice.store = req.body.store;

    invoice.warehouse = req.body.warehouse;

    invoice.invoiceDate = req.body.invoiceDate;

    invoice.coupon = req.body.coupon || null;

    invoice.billingType = req.body.billingType;

    invoice.customerType = req.body.customerType;

    invoice.items = req.body.items;

    invoice.discountAmount = Number(req.body.discountAmount || 0);

    invoice.paidAmount = Number(req.body.paidAmount || 0);

    invoice.paymentMethod = req.body.paymentMethod;

    invoice.returnStatus = req.body.returnStatus || invoice.returnStatus || "None";

    invoice.remarks = req.body.remarks || "";

    invoice.updatedBy = req.user?._id || req.user?.id;

    // pre-save middleware recalculates totals
    await invoice.save({ session });

    /* ===================================================
       DEDUCT PRODUCT STOCK
    ==================================================== */

    for (const item of invoice.items) {
      const product = await Product.findById(item.product).session(session);

      product.totalStock -= Number(item.quantity);

      await product.save({ session });

      /* ---------------- Variant ---------------- */

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(
          session,
        );

        variant.currentStock -= Number(item.quantity);

        await variant.save({ session });
      }

      /* ---------------- Batch ---------------- */

      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);

        batch.remainingQuantity -= Number(item.quantity);

        await batch.save({ session });
      }
    }

    /* ===================================================
       COMMIT TRANSACTION
    ==================================================== */

    await session.commitTransaction();

    session.endSession();

    /* ===================================================
       POPULATE
    ==================================================== */

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
    /* ===================================================
       ROLLBACK
    ==================================================== */

    await session.abortTransaction();

    session.endSession();

    console.error("Update Sales Invoice Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};


// ============================================================// DELETE SALES INVOICE// ============================================================

exports.deleteSalesInvoice = async (req, res) => {const session = await mongoose.startSession();

try {// ==========================================================// START TRANSACTION// ==========================================================

session.startTransaction();

const { id } = req.params;

// ==========================================================
// VALIDATE ID
// ==========================================================

if (!mongoose.Types.ObjectId.isValid(id)) {
  await session.abortTransaction();
  session.endSession();

  return res.status(400).json({
    success: false,
    message: "Invalid Sales Invoice ID",
  });
}

// ==========================================================
// FIND ACTIVE SALES INVOICE
// ==========================================================

const invoice = await SalesInvoice.findOne({
  _id: id,
  isDeleted: false,
}).session(session);

if (!invoice) {
  await session.abortTransaction();
  session.endSession();

  return res.status(404).json({
    success: false,
    message: "Sales Invoice not found or already deleted",
  });
}

// ==========================================================
// VALIDATE ITEMS
// ==========================================================

if (!invoice.items || invoice.items.length === 0) {
  await session.abortTransaction();
  session.endSession();

  return res.status(400).json({
    success: false,
    message: "Sales Invoice does not contain any items",
  });
}

// ==========================================================
// RESTORE STOCK
// ==========================================================

for (const item of invoice.items) {
  const quantity = Number(item.quantity);

  // --------------------------------------------------------
  // Validate quantity
  // --------------------------------------------------------

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(
      `Invalid quantity in invoice item: ${item.productName}`
    );
  }

  // ========================================================
  // PRODUCT STOCK
  // ========================================================

  if (item.product) {
    const product = await Product.findById(item.product).session(
      session
    );

    if (!product) {
      throw new Error(
        `Product not found: ${item.product}`
      );
    }

    product.totalStock =
      (Number(product.totalStock) || 0) + quantity;

    await product.save({
      session,
    });
  }

  // ========================================================
  // VARIANT STOCK
  // ========================================================

  if (item.variant) {
    const variant = await ProductVariant.findById(
      item.variant
    ).session(session);

    if (!variant) {
      throw new Error(
        `Product variant not found: ${item.variant}`
      );
    }

    variant.currentStock =
      (Number(variant.currentStock) || 0) + quantity;

    await variant.save({
      session,
    });
  }

  // ========================================================
  // BATCH STOCK
  // ========================================================

  if (item.batch) {
    const batch = await Batch.findById(item.batch).session(
      session
    );

    if (!batch) {
      throw new Error(
        `Batch not found: ${item.batch}`
      );
    }

    batch.remainingQuantity =
      (Number(batch.remainingQuantity) || 0) + quantity;

    await batch.save({
      session,
    });
  }
}

// ==========================================================
// USER WHO DELETED
// ==========================================================

const deletedBy =
  req.user?._id ||
  req.user?.id ||
  null;

// ==========================================================
// SOFT DELETE
// ==========================================================

await SalesInvoice.updateOne(
  {
    _id: invoice._id,
    isDeleted: false,
  },
  {
    $set: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy,
      updatedBy: deletedBy,
    },
  },
  {
    session,
  }
);

// ==========================================================
// COMMIT TRANSACTION
// ==========================================================

await session.commitTransaction();

session.endSession();

// ==========================================================
// SUCCESS
// ==========================================================

return res.status(200).json({
  success: true,
  message: "Sales Invoice deleted successfully",
  data: {
    invoiceId: invoice._id,
    invoiceNo: invoice.invoiceNo,
    deletedAt: new Date(),
  },
});

} catch (error) {// ==========================================================// ROLLBACK// ==========================================================

if (session.inTransaction()) {
  await session.abortTransaction();
}

session.endSession();

console.error(
  "Delete Sales Invoice Error:",
  error
);

return res.status(500).json({
  success: false,
  message:
    error.message ||
    "Failed to delete Sales Invoice",
});

}};