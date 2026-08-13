const mongoose = require("mongoose");
const SalesReturn = require("../models/SalesReturn");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const Batch = require("../models/Batch");

exports.createSalesReturn = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      returnNo,
      invoice,
      customer,
      store,
      warehouse,
      returnDate,
      returnType,
      refundMethod,
      reason,
      remarks,
      items,
    } = req.body;

    /* ===============================
       Return Number Validation
    =============================== */

    const existingReturn = await SalesReturn.findOne({
      returnNo,
      isDeleted: false,
    }).session(session);

    if (existingReturn) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Return number already exists",
      });
    }

    /* ===============================
       Invoice Validation
    =============================== */

    let salesInvoice = null;

    if (mongoose.Types.ObjectId.isValid(invoice)) {
      salesInvoice = await SalesInvoice.findById(invoice)
        .populate("items.product")
        .populate("items.variant")
        .populate("items.batch")
        .session(session);
    } else {
      salesInvoice = await SalesInvoice.findOne({
        invoiceNo: invoice,
      })
        .populate("items.product")
        .populate("items.variant")
        .populate("items.batch")
        .session(session);
    }

    if (!salesInvoice) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Sales Invoice not found",
      });
    }

    /* ===============================
       Customer Validation
    =============================== */

    if (customer) {
      const customerExists = await Customer.findById(customer).session(session);

      if (!customerExists) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    /* ===============================
       Items Validation
    =============================== */

    if (!items || items.length === 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Return items are required",
      });
    }

    // Will hold items enriched with salesPrice (and any other required
    // price fields) pulled from the matching invoice line, since the
    // client request does not reliably send these.
    const enrichedItems = [];

    for (const item of items) {

      const product = await Product.findById(item.product).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: `Product not found : ${item.product}`,
        });
      }

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(session);

        if (!variant) {
          await session.abortTransaction();
          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Variant not found : ${item.variant}`,
          });
        }
      }

      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);

        if (!batch) {
          await session.abortTransaction();
          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Batch not found : ${item.batch}`,
          });
        }
      }

      /* ===============================
         Find Product in Invoice
      =============================== */

      const invoiceItem = salesInvoice.items.find((invItem) => {

        const invoiceProductId =
          invItem.product?._id
            ? invItem.product._id.toString()
            : invItem.product.toString();

        const invoiceVariantId =
          invItem.variant
            ? invItem.variant._id
              ? invItem.variant._id.toString()
              : invItem.variant.toString()
            : "";

        const invoiceBatchId =
          invItem.batch
            ? invItem.batch._id
              ? invItem.batch._id.toString()
              : invItem.batch.toString()
            : "";

        return (
          invoiceProductId === item.product.toString() &&
          invoiceVariantId === (item.variant ? item.variant.toString() : "") &&
          invoiceBatchId === (item.batch ? item.batch.toString() : "")
        );
      });

      if (!invoiceItem) {

        console.log("Invoice Items:");
        console.log(
          salesInvoice.items.map(i => ({
            product: i.product,
            variant: i.variant,
            batch: i.batch,
            quantity: i.quantity
          }))
        );

        console.log("Return Item:", item);

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: `${item.productName} not found in sales invoice`,
        });
      }

      if (Number(item.quantity) > Number(invoiceItem.quantity)) {

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: `${item.productName} return quantity exceeds invoice quantity`,
        });
      }

      /* ===============================
         Enrich item with price fields from invoice
         NOTE: confirm the actual field name(s) on your SalesInvoice
         items sub-schema (salesPrice / price / rate / unitPrice) and
         adjust the fallback chain below accordingly. Add any other
         required numeric fields (mrp, discount, taxRate, etc.) the
         same way if your SalesReturn schema needs them.
      =============================== */

      enrichedItems.push({
        ...item,
        salesPrice:
          item.salesPrice ??
          invoiceItem.salesPrice ??
          invoiceItem.price ??
          invoiceItem.rate ??
          invoiceItem.unitPrice,
      });
    }

    /* ===============================
       Create Sales Return
    =============================== */

    const salesReturn = new SalesReturn({
      returnNo,
      invoice: salesInvoice._id,
      customer,
      store,
      warehouse,
      returnDate,
      returnType,
      refundMethod,
      reason,
      remarks,
      items: enrichedItems,
      createdBy: req.user?._id || req.user?.id,
    });

    await salesReturn.save({ session });

    /* ===============================
       Increase Stock
    =============================== */

    for (const item of enrichedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            totalStock: Number(item.quantity),
          },
        },
        { session }
      );

      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(
          item.variant,
          {
            $inc: {
              currentStock: Number(item.quantity),
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
              remainingQuantity: Number(item.quantity),
            },
          },
          { session }
        );
      }
    }

    /* ===============================
       Update Invoice Return Status
    =============================== */

    // Read the actual allowed values straight from the schema instead of
    // guessing a string — avoids repeated enum-mismatch errors.
    const allowedInvoiceStatuses =
      SalesInvoice.schema.path("returnStatus")?.enumValues || [];

    console.log("Allowed SalesInvoice.returnStatus values:", allowedInvoiceStatuses);

    // Prefer something that looks like "partially returned"; fall back to
    // "returned"; fall back to the last enum value; fall back to leaving
    // it untouched if the field has no enum at all.
    const partialMatch = allowedInvoiceStatuses.find((v) =>
      /partial/i.test(v)
    );
    const returnedMatch = allowedInvoiceStatuses.find((v) =>
      /^returned$/i.test(v)
    );

    const nextInvoiceStatus =
      partialMatch ||
      returnedMatch ||
      allowedInvoiceStatuses[allowedInvoiceStatuses.length - 1];

    if (nextInvoiceStatus) {
      salesInvoice.returnStatus = nextInvoiceStatus;
      await salesInvoice.save({ session });
    } else {
      console.warn(
        "Could not determine a valid returnStatus for SalesInvoice; leaving unchanged."
      );
    }

    await session.commitTransaction();
    session.endSession();

    try {
      const result = await SalesReturn.findById(salesReturn._id)
        .populate("invoice", "invoiceNo grandTotal")
        .populate("customer", "customerName customerCode")
        .populate("store", "storeName")
        .populate("warehouse", "warehouseName")
        .populate("createdBy", "firstName lastName")
        .populate("items.product", "productName productCode")
        .populate("items.variant", "variantName skuCode barcode")
        .populate("items.batch", "batchNumber");

      return res.status(201).json({
        success: true,
        message: "Sales Return created successfully",
        data: result,
      });
    } catch (populateError) {
      // The SalesReturn was already committed successfully at this point.
      // A failure here is just in fetching/populating the response, not
      // in creating the record — so we still report success, but log the
      // populate error so you can see what's actually going wrong.
      console.error("Sales Return created, but populate failed:", populateError);

      return res.status(201).json({
        success: true,
        message: "Sales Return created successfully (response population failed)",
        data: salesReturn,
      });
    }
  } catch (error) {
    // Only abort if the transaction is still active — calling
    // abortTransaction after a successful commit throws its own error
    // and masks whatever actually failed (e.g. in the post-commit query).
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Create Sales Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSalesReturns = async (req, res) => {
  try {
    const {
      search,
      invoice,
      customer,
      store,
      warehouse,
      returnType,
      refundMethod,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    /* ===============================
       Filter
    =============================== */

    const filter = {
      isDeleted: false,
    };

    if (invoice) {
      filter.invoice = invoice;
    }

    if (customer) {
      filter.customer = customer;
    }

    if (store) {
      filter.store = store;
    }

    if (warehouse) {
      filter.warehouse = warehouse;
    }

    if (returnType) {
      filter.returnType = returnType;
    }

    if (refundMethod) {
      filter.refundMethod = refundMethod;
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
       Search
    =============================== */

    if (search) {
      filter.$or = [
        {
          returnNo: {
            $regex: search,
            $options: "i",
          },
        },
        {
          reason: {
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

    /* ===============================
       Pagination
    =============================== */

    const currentPage = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const skip = (currentPage - 1) * pageSize;

    /* ===============================
       Total Count
    =============================== */

    const total = await SalesReturn.countDocuments(filter);

    /* ===============================
       Fetch Data
    =============================== */

    // NOTE: "items" is included in the invoice select below because a
    // virtual on the SalesInvoice model (around line 376) reads
    // `this.items.length` (or similar). Mongoose virtuals still run even
    // on populated subdocuments with a restricted `select`, and if the
    // field the virtual depends on isn't selected, `this.items` comes
    // back `undefined` and the virtual throws when the document is
    // serialized to JSON. Selecting it here avoids the crash. The
    // proper long-term fix is still to guard the virtual itself in
    // SalesInvoice.js, e.g. `(this.items || []).length`.
    const salesReturns = await SalesReturn.find(filter)
      .populate(
        "invoice",
        "invoiceNo grandTotal paymentStatus returnStatus items"
      )
      .populate("customer", "customerName customerCode mobile")
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "variantName skuCode barcode")
      .populate("items.batch", "batchNumber batchCode")
      .sort({
        [sortBy]: order === "asc" ? 1 : -1,
      })
      .skip(skip)
      .limit(pageSize);

    /* ===============================
       Response
    =============================== */

    return res.status(200).json({
      success: true,
      count: salesReturns.length,
      totalRecords: total,
      totalPages: Math.ceil(total / pageSize),
      currentPage,
      pageSize,
      data: salesReturns,
    });
  } catch (error) {
    console.error("Get Sales Returns Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSalesReturnById = async (req, res) => {
  try {
    const { id } = req.params;

    /* ===============================
       Validate ObjectId
    =============================== */

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Sales Return ID",
      });
    }

    /* ===============================
       Find Sales Return
    =============================== */

 
    const salesReturn = await SalesReturn.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate(
        "invoice",
        "invoiceNo invoiceDate grandTotal paidAmount dueAmount paymentStatus returnStatus items"
      )
      .populate(
        "customer",
        "customerName customerCode mobile email address gstNumber"
      )
      .populate("store", "storeName storeCode")
      .populate("warehouse", "warehouseName warehouseCode")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("items.product", "productName productCode hsnCode")
      .populate("items.variant", "variantName skuCode barcode")
      .populate("items.batch", "batchNumber batchCode expiryDate");

    /* ===============================
       Not Found
    =============================== */

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: "Sales Return not found",
      });
    }

    /* ===============================
       Response
    =============================== */

    return res.status(200).json({
      success: true,
      data: salesReturn,
    });
  } catch (error) {
    console.error("Get Sales Return By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.updateSalesReturn = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    const {
      invoice,
      customer,
      store,
      warehouse,
      returnDate,
      returnType,
      refundMethod,
      reason,
      remarks,
      items,
    } = req.body;

    /* ==========================================
       Find Sales Return
    ========================================== */

    const salesReturn = await SalesReturn.findOne({
      _id: id,
      isDeleted: false,
    }).session(session);

    if (!salesReturn) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Sales Return not found",
      });
    }

    /* ==========================================
       Restore Previous Stock
    ========================================== */

    for (const item of salesReturn.items) {

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

    /* ==========================================
       Validate Sales Invoice
    ========================================== */

    const salesInvoice = await SalesInvoice.findById(invoice)
      .populate("items.product")
      .populate("items.variant")
      .populate("items.batch")
      .session(session);

    if (!salesInvoice) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Sales Invoice not found",
      });
    }

    /* ==========================================
       Validate Customer
    ========================================== */

    if (customer) {
      const customerExists = await Customer.findById(customer).session(session);

      if (!customerExists) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    /* ==========================================
       Validate Items
    ========================================== */

    if (!items || items.length === 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Return items are required",
      });
    }

    /* ==========================================
       Validate Every Item
    ========================================== */

    const enrichedItems = [];

    for (const item of items) {

      // Product Validation
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: `Product not found : ${item.product}`,
        });
      }

      // Variant Validation
      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant).session(session);

        if (!variant) {
          await session.abortTransaction();
          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Variant not found : ${item.variant}`,
          });
        }
      }

      // Batch Validation
      if (item.batch) {
        const batch = await Batch.findById(item.batch).session(session);

        if (!batch) {
          await session.abortTransaction();
          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Batch not found : ${item.batch}`,
          });
        }
      }

      /* ==========================================
         Validate Against Original Invoice
      ========================================== */

      const invoiceItem = salesInvoice.items.find((i) => {

        const sameProduct =
          String(i.product._id) === String(item.product);

        // i.variant / i.batch are populated documents here (not raw
        // ObjectIds), because salesInvoice was loaded with
        // .populate("items.variant") / .populate("items.batch").
        // String(populatedDoc) does NOT produce the hex id — it
        // stringifies the whole object — so the id must be pulled out
        // via ._id explicitly, same as sameProduct already does.
        const invoiceVariantId = i.variant
          ? String(i.variant._id || i.variant)
          : "";
        const invoiceBatchId = i.batch
          ? String(i.batch._id || i.batch)
          : "";

        const sameVariant =
          invoiceVariantId === String(item.variant || "");

        const sameBatch =
          invoiceBatchId === String(item.batch || "");

        return sameProduct && sameVariant && sameBatch;
      });

      if (!invoiceItem) {

        // Same diagnostic approach as createSalesReturn: show what the
        // invoice actually has for this product, so a variant/batch
        // mismatch (or wrong invoice ID) is visible directly in the
        // response instead of requiring a server-log dig.
        const candidateLines = salesInvoice.items
          .filter((i) => String(i.product._id) === String(item.product))
          .map((i) => ({
            product: String(i.product._id),
            variant: i.variant ? String(i.variant._id || i.variant) : null,
            batch: i.batch ? String(i.batch._id || i.batch) : null,
            quantity: i.quantity,
          }));

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: `${item.productName} not found in Sales Invoice`,
          debug: {
            requestedItem: {
              product: item.product,
              variant: item.variant || null,
              batch: item.batch || null,
            },
            matchingProductLinesOnInvoice: candidateLines,
            note:
              candidateLines.length === 0
                ? "This product does not exist on this invoice at all — check the invoice ID."
                : "This product exists on the invoice, but its variant and/or batch don't match the ones sent in the request.",
          },
        });
      }

      /* ==========================================
         Quantity Validation
      ========================================== */

      if (Number(item.quantity) > Number(invoiceItem.quantity)) {

        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: `${item.productName} return quantity exceeds invoice quantity`,
        });
      }

      /* ==========================================
         Enrich with salesPrice from invoice
         (same fix applied in createSalesReturn — the client request
         doesn't reliably send salesPrice, but the SalesReturn schema
         requires it)
      ========================================== */

      enrichedItems.push({
        ...item,
        salesPrice:
          item.salesPrice ??
          invoiceItem.salesPrice ??
          invoiceItem.price ??
          invoiceItem.rate ??
          invoiceItem.unitPrice,
      });
    }

    /* ==========================================
       Update Sales Return Fields
    ========================================== */

    salesReturn.invoice = invoice;
    salesReturn.customer = customer;
    salesReturn.store = store;
    salesReturn.warehouse = warehouse;
    salesReturn.returnDate = returnDate;
    salesReturn.returnType = returnType;
    salesReturn.refundMethod = refundMethod;
    salesReturn.reason = reason;
    salesReturn.remarks = remarks;
    salesReturn.items = enrichedItems;
    salesReturn.updatedBy = req.user?._id || req.user?.id;

    /* ==========================================
       Save Sales Return
    ========================================== */

    await salesReturn.save({ session });

    /* ==========================================
       Increase New Product Stock
    ========================================== */

    for (const item of salesReturn.items) {

      //---------------------------------
      // Product Stock
      //---------------------------------

      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            totalStock: Number(item.quantity),
          },
        },
        { session }
      );

      //---------------------------------
      // Variant Stock
      //---------------------------------

      if (item.variant) {
        await ProductVariant.findByIdAndUpdate(
          item.variant,
          {
            $inc: {
              currentStock: Number(item.quantity),
            },
          },
          { session }
        );
      }

      //---------------------------------
      // Batch Quantity
      //---------------------------------

      if (item.batch) {
        await Batch.findByIdAndUpdate(
          item.batch,
          {
            $inc: {
              remainingQuantity: Number(item.quantity),
            },
          },
          { session }
        );
      }
    }

    /* ==========================================
       Update Sales Invoice Return Status
    ========================================== */

    let totalReturnedQty = 0;
    let totalInvoiceQty = 0;

    const allReturns = await SalesReturn.find({
      invoice,
      isDeleted: false,
      _id: { $ne: salesReturn._id },
    }).session(session);

    // Previous Returns
    for (const sr of allReturns) {
      sr.items.forEach((item) => {
        totalReturnedQty += Number(item.quantity || 0);
      });
    }

    // Current Updated Return
    salesReturn.items.forEach((item) => {
      totalReturnedQty += Number(item.quantity || 0);
    });

    // Invoice Quantity
    salesInvoice.items.forEach((item) => {
      totalInvoiceQty += Number(item.quantity || 0);
    });

    // NOTE: SalesInvoice.returnStatus enum is case-sensitive and is
    // actually ["None", "Partial", "Returned"] (confirmed via schema
    // introspection earlier) — NOT lowercase "none"/"partial"/"returned".
    // Using the wrong case here will throw a ValidationError on save.
    let returnStatus = "None";

    if (totalReturnedQty === 0) {
      returnStatus = "None";
    } else if (totalReturnedQty < totalInvoiceQty) {
      returnStatus = "Partial";
    } else {
      returnStatus = "Returned";
    }

    await SalesInvoice.findByIdAndUpdate(
      invoice,
      {
        returnStatus,
      },
      { session }
    );

    /* ==========================================
       Commit Transaction
    ========================================== */

    await session.commitTransaction();
    session.endSession();

    /* ==========================================
       Populate Updated Sales Return
    ========================================== */

    // Isolated in its own try/catch: the SalesReturn is already
    // committed at this point, so a populate failure here shouldn't
    // turn into a 500 for data that already saved successfully. Also
    // note "items" is included in the invoice select — a virtual on
    // SalesInvoice (around line 376) throws if that field isn't
    // selected on the populated subdocument.
    try {
      const result = await SalesReturn.findById(salesReturn._id)
        .populate("invoice", "invoiceNo grandTotal paymentStatus returnStatus items")
        .populate("customer", "customerName customerCode mobile email")
        .populate("store", "storeName storeCode")
        .populate("warehouse", "warehouseName warehouseCode")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .populate("items.product", "productName productCode")
        .populate("items.variant", "variantName skuCode barcode")
        .populate("items.batch", "batchNumber batchCode");

      return res.status(200).json({
        success: true,
        message: "Sales Return updated successfully",
        data: result,
      });
    } catch (populateError) {
      console.error("Sales Return updated, but populate failed:", populateError);

      return res.status(200).json({
        success: true,
        message: "Sales Return updated successfully (response population failed)",
        data: salesReturn,
      });
    }

  } catch (error) {

    /* ==========================================
       Rollback Transaction
    ========================================== */

    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Update Sales Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
exports.deleteSalesReturn = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    // ==========================================================
    // START TRANSACTION
    // ==========================================================

    session.startTransaction();

    const { id } = req.params;

    // ==========================================================
    // VALIDATE SALES RETURN ID
    // ==========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid Sales Return ID",
      });
    }

    // ==========================================================
    // FIND ACTIVE SALES RETURN
    // ==========================================================

    const salesReturn = await SalesReturn.findOne({
      _id: id,
      isDeleted: false,
    }).session(session);

    if (!salesReturn) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Sales Return not found or already deleted",
      });
    }

    // ==========================================================
    // VALIDATE ITEMS
    // ==========================================================

    if (
      !Array.isArray(salesReturn.items) ||
      salesReturn.items.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Sales Return does not contain any items",
      });
    }

    // ==========================================================
    // RESTORE / REVERSE STOCK
    //
    // Sales Return creation:
    //     Stock + returned quantity
    //
    // Sales Return deletion:
    //     Stock - returned quantity
    // ==========================================================

    for (const item of salesReturn.items) {
      const quantity = Number(item.quantity);

      // --------------------------------------------------------
      // Validate quantity
      // --------------------------------------------------------

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(
          `Invalid quantity in sales return item: ${
            item.productName || item.product
          }`
        );
      }

      // ========================================================
      // PRODUCT
      // ========================================================

      if (item.product) {
        const product = await Product.findById(
          item.product
        ).session(session);

        if (!product) {
          throw new Error(
            `Product not found: ${item.product}`
          );
        }

        const currentStock =
          Number(product.totalStock) || 0;

        // Prevent negative stock
        if (currentStock < quantity) {
          throw new Error(
            `Insufficient product stock to delete sales return for ${
              item.productName || item.product
            }. Current stock: ${currentStock}, required: ${quantity}`
          );
        }

        product.totalStock =
          currentStock - quantity;

        await product.save({
          session,
        });
      }

      // ========================================================
      // VARIANT
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

        const currentStock =
          Number(variant.currentStock) || 0;

        // Prevent negative stock
        if (currentStock < quantity) {
          throw new Error(
            `Insufficient variant stock to delete sales return. Current stock: ${currentStock}, required: ${quantity}`
          );
        }

        variant.currentStock =
          currentStock - quantity;

        await variant.save({
          session,
        });
      }

      // ========================================================
      // BATCH
      // ========================================================

      if (item.batch) {
        const batch = await Batch.findById(
          item.batch
        ).session(session);

        if (!batch) {
          throw new Error(
            `Batch not found: ${item.batch}`
          );
        }

        const currentQuantity =
          Number(batch.remainingQuantity) || 0;

        // Prevent negative batch quantity
        if (currentQuantity < quantity) {
          throw new Error(
            `Insufficient batch quantity to delete sales return. Current quantity: ${currentQuantity}, required: ${quantity}`
          );
        }

        batch.remainingQuantity =
          currentQuantity - quantity;

        await batch.save({
          session,
        });
      }
    }

    // ==========================================================
    // GET USER
    // ==========================================================

    const userId =
      req.user?._id ||
      req.user?.id ||
      null;

    // ==========================================================
    // SOFT DELETE SALES RETURN
    // ==========================================================

    await SalesReturn.updateOne(
      {
        _id: salesReturn._id,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          updatedBy: userId,
        },
      },
      {
        session,
      }
    );

    // ==========================================================
    // UPDATE SALES INVOICE RETURN STATUS
    // ==========================================================

    if (salesReturn.invoice) {
      const invoice = await SalesInvoice.findOne({
        _id: salesReturn.invoice,
        isDeleted: false,
      }).session(session);

      if (invoice) {
        // ------------------------------------------------------
        // Calculate total invoice quantity
        // ------------------------------------------------------

        let totalInvoiceQty = 0;

        for (const invoiceItem of invoice.items) {
          totalInvoiceQty += Number(
            invoiceItem.quantity || 0
          );
        }

        // ------------------------------------------------------
        // Get remaining ACTIVE sales returns
        //
        // Current deleted return is already marked deleted,
        // therefore it won't be included.
        // ------------------------------------------------------

        const activeReturns = await SalesReturn.find({
          invoice: invoice._id,
          isDeleted: false,
        }).session(session);

        let returnedQty = 0;

        for (const activeReturn of activeReturns) {
          for (const returnItem of activeReturn.items) {
            returnedQty += Number(
              returnItem.quantity || 0
            );
          }
        }

        // ------------------------------------------------------
        // Determine invoice return status
        // ------------------------------------------------------

        let returnStatus = "None";

        if (returnedQty === 0) {
          returnStatus = "None";
        } else if (returnedQty < totalInvoiceQty) {
          returnStatus = "Partial";
        } else {
          returnStatus = "Returned";
        }

        // ------------------------------------------------------
        // Update invoice
        // ------------------------------------------------------

        await SalesInvoice.updateOne(
          {
            _id: invoice._id,
          },
          {
            $set: {
              returnStatus: returnStatus,
              updatedBy: userId,
            },
          },
          {
            session,
          }
        );
      }
    }

    // ==========================================================
    // COMMIT TRANSACTION
    // ==========================================================

    await session.commitTransaction();

    session.endSession();

    // ==========================================================
    // SUCCESS RESPONSE
    // ==========================================================

    return res.status(200).json({
      success: true,
      message: "Sales Return deleted successfully",
      data: {
        salesReturnId: salesReturn._id,
        returnNo: salesReturn.returnNo || null,
        invoiceId: salesReturn.invoice || null,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    // ==========================================================
    // ROLLBACK
    // ==========================================================

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error(
      "Delete Sales Return Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete Sales Return",
    });
  }
};