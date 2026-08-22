const mongoose = require("mongoose");

const HoldBill = require("../models/HoldBill");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Store = require("../models/Store");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const Batch = require("../models/Batch");

/* =========================================================
   GENERATE HOLD NUMBER
========================================================= */

const generateHoldNo = async (session = null) => {
  const query = HoldBill.findOne()
    .sort({ createdAt: -1 })
    .select("holdNo");

  if (session) {
    query.session(session);
  }

  const lastHold = await query;

  let nextNumber = 1;

  if (lastHold && lastHold.holdNo) {
    const number =
      parseInt(String(lastHold.holdNo).replace("HB", "")) || 0;

    nextNumber = number + 1;
  }

  return `HB${String(nextNumber).padStart(6, "0")}`;
};


/* =========================================================
   GENERATE UNIQUE INVOICE NUMBER
   Example:
   INV20260821143512345678
========================================================= */

const generateInvoiceNo = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  // Extra random part prevents collision during simultaneous requests
  const random = Math.floor(100 + Math.random() * 900);

  return `INV${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;
};


/* =========================================================
   CREATE HOLD BILL
========================================================= */

exports.createHoldBill = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      customer,
      store,
      cashier,
      remarks,
      items,
    } = req.body;

    /* -------------------------
       STORE REQUIRED
    ------------------------- */

    if (!store) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Store is required",
      });
    }

    /* -------------------------
       ITEMS REQUIRED
    ------------------------- */

    if (!Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    /* -------------------------
       GENERATE HOLD NUMBER
    ------------------------- */

    const holdNo = await generateHoldNo(session);

    /* -------------------------
       CUSTOMER VALIDATION
    ------------------------- */

    if (customer) {
      const customerData = await Customer.findById(customer)
        .session(session);

      if (!customerData) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    /* -------------------------
       STORE VALIDATION
    ------------------------- */

    const storeData = await Store.findById(store)
      .session(session);

    if (!storeData) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    /* -------------------------
       VALIDATE ITEMS
    ------------------------- */

    const holdItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product)
        .session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: `Product not found : ${item.product}`,
        });
      }

      if (item.variant) {
        const variant = await ProductVariant.findById(item.variant)
          .session(session);

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
        const batch = await Batch.findById(item.batch)
          .session(session);

        if (!batch) {
          await session.abortTransaction();
          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Batch not found : ${item.batch}`,
          });
        }
      }

      if (Number(item.quantity) <= 0) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: `${item.productName} quantity must be greater than zero`,
        });
      }

      holdItems.push({
        product: item.product,
        variant: item.variant || null,
        batch: item.batch || null,
        skuCode: item.skuCode,
        barcode: item.barcode,
        productName: item.productName,
        quantity: Number(item.quantity),
        salesPrice: Number(item.salesPrice),
        discount: Number(item.discount || 0),
        gstPercentage: Number(item.gstPercentage || 0),
      });
    }

    /* -------------------------
       CREATE HOLD BILL
    ------------------------- */

    const holdBill = new HoldBill({
      holdNo,
      customer,
      store,
      cashier,
      remarks,
      items: holdItems,
      createdBy: req.user?._id || req.user?.id,
    });

    await holdBill.save({ session });

    await session.commitTransaction();
    session.endSession();

    /* -------------------------
       POPULATE RESPONSE
    ------------------------- */

    const result = await HoldBill.findById(holdBill._id)
      .populate("customer", "customerName customerCode")
      .populate("store", "storeName storeCode")
      .populate("cashier", "firstName lastName")
      .populate("createdBy", "firstName lastName")
      .populate("items.product", "productName productCode")
      .populate("items.variant", "variantName skuCode")
      .populate("items.batch", "batchNumber");

    return res.status(201).json({
      success: true,
      message: "Hold Bill created successfully",
      data: result,
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error("Create Hold Bill Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET ALL HOLD BILLS
========================================================= */

exports.getAllHoldBills = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      customer,
      store,
      cashier,
      fromDate,
      toDate,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNumber = Math.max(parseInt(page) || 1, 1);
    const pageSize = Math.max(parseInt(limit) || 10, 1);
    const skip = (pageNumber - 1) * pageSize;

    const filter = {
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    if (customer) {
      filter.customer = customer;
    }

    if (store) {
      filter.store = store;
    }

    if (cashier) {
      filter.cashier = cashier;
    }

    /* -------------------------
       DATE FILTER
    ------------------------- */

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

    /* -------------------------
       SEARCH
    ------------------------- */

    if (search) {
      filter.$or = [
        {
          holdNo: {
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
        {
          "items.productName": {
            $regex: search,
            $options: "i",
          },
        },
        {
          "items.skuCode": {
            $regex: search,
            $options: "i",
          },
        },
        {
          "items.barcode": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /* -------------------------
       SORT
    ------------------------- */

    const sort = {};

    sort[sortBy] = order === "asc" ? 1 : -1;

    /* -------------------------
       FETCH
    ------------------------- */

    const holdBills = await HoldBill.find(filter)
      .populate(
        "customer",
        "customerCode customerName phone"
      )
      .populate(
        "store",
        "storeCode storeName"
      )
      .populate(
        "cashier",
        "firstName lastName"
      )
      .populate(
        "salesInvoice",
        "invoiceNo grandTotal"
      )
      .populate(
        "createdBy",
        "firstName lastName"
      )
      .populate(
        "items.product",
        "productCode productName"
      )
      .populate(
        "items.variant",
        "variantName skuCode"
      )
      .populate(
        "items.batch",
        "batchNumber"
      )
      .sort(sort)
      .skip(skip)
      .limit(pageSize);

    const totalRecords = await HoldBill.countDocuments(filter);

    const totalPages = Math.ceil(
      totalRecords / pageSize
    );

    return res.status(200).json({
      success: true,
      message: "Hold Bills fetched successfully",

      pagination: {
        currentPage: pageNumber,
        perPage: pageSize,
        totalRecords,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },

      data: holdBills,
    });

  } catch (error) {
    console.error("Get Hold Bills Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET HOLD BILL BY ID
========================================================= */

exports.getHoldBillById = async (req, res) => {
  try {
    const holdBill = await HoldBill.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate(
        "customer",
        "customerCode customerName phone"
      )
      .populate(
        "store",
        "storeCode storeName"
      )
      .populate(
        "cashier",
        "firstName lastName"
      )
      .populate(
        "salesInvoice",
        "invoiceNo grandTotal"
      )
      .populate(
        "createdBy",
        "firstName lastName"
      )
      .populate(
        "updatedBy",
        "firstName lastName"
      )
      .populate(
        "items.product",
        "productCode productName"
      )
      .populate(
        "items.variant",
        "variantName skuCode"
      )
      .populate(
        "items.batch",
        "batchNumber"
      );

    if (!holdBill) {
      return res.status(404).json({
        success: false,
        message: "Hold Bill not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: holdBill,
    });

  } catch (error) {
    console.error("Get Hold Bill By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   UPDATE HOLD BILL
========================================================= */

exports.updateHoldBill = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const holdBill = await HoldBill.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);

    if (!holdBill) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Hold Bill not found",
      });
    }

    if (holdBill.status === "Converted") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Converted Hold Bill cannot be updated",
      });
    }

    const {
      customer,
      store,
      cashier,
      remarks,
      status,
      items,
    } = req.body;

    /* -------------------------
       CUSTOMER
    ------------------------- */

    if (customer) {
      const customerData = await Customer.findById(customer)
        .session(session);

      if (!customerData) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      holdBill.customer = customer;
    }

    /* -------------------------
       STORE
    ------------------------- */

    if (store) {
      const storeData = await Store.findById(store)
        .session(session);

      if (!storeData) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }

      holdBill.store = store;
    }

    if (cashier) {
      holdBill.cashier = cashier;
    }

    if (remarks !== undefined) {
      holdBill.remarks = remarks;
    }

    if (status) {
      holdBill.status = status;
    }

    /* -------------------------
       ITEMS
    ------------------------- */

    if (Array.isArray(items)) {
      const updatedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product)
          .session(session);

        if (!product) {
          await session.abortTransaction();
          session.endSession();

          return res.status(404).json({
            success: false,
            message: `Product not found : ${item.product}`,
          });
        }

        if (Number(item.quantity) <= 0) {
          await session.abortTransaction();
          session.endSession();

          return res.status(400).json({
            success: false,
            message: `${item.productName} quantity must be greater than zero`,
          });
        }

        if (item.variant) {
          const variant = await ProductVariant.findById(
            item.variant
          ).session(session);

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
          const batch = await Batch.findById(
            item.batch
          ).session(session);

          if (!batch) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
              success: false,
              message: `Batch not found : ${item.batch}`,
            });
          }
        }

        updatedItems.push({
          product: item.product,
          variant: item.variant || null,
          batch: item.batch || null,
          skuCode: item.skuCode,
          barcode: item.barcode,
          productName: item.productName,
          quantity: Number(item.quantity),
          salesPrice: Number(item.salesPrice),
          discount: Number(item.discount || 0),
          gstPercentage: Number(item.gstPercentage || 0),
        });
      }

      holdBill.items = updatedItems;
    }

    holdBill.updatedBy =
      req.user?._id || req.user?.id;

    await holdBill.save({ session });

    await session.commitTransaction();
    session.endSession();

    const result = await HoldBill.findById(
      holdBill._id
    )
      .populate(
        "customer",
        "customerCode customerName"
      )
      .populate(
        "store",
        "storeName"
      )
      .populate(
        "cashier",
        "firstName lastName"
      )
      .populate(
        "items.product",
        "productName productCode"
      );

    return res.status(200).json({
      success: true,
      message: "Hold Bill updated successfully",
      data: result,
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error("Update Hold Bill Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   CONVERT HOLD BILL TO SALES INVOICE
========================================================= */

exports.convertHoldBillToInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    /* =====================================================
       STEP 1
       ATOMICALLY LOCK HOLD BILL
    ===================================================== */

    const holdBill = await HoldBill.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,

        // Do not allow another conversion
        status: {
          $nin: ["Converted", "Converting"],
        },

        // Do not allow conversion if invoice already exists
        $or: [
          {
            salesInvoice: {
              $exists: false,
            },
          },
          {
            salesInvoice: null,
          },
        ],
      },
      {
        $set: {
          status: "Converting",
          updatedBy:
            req.user?._id || req.user?.id,
        },
      },
      {
        new: true,
        session,
      }
    )
      .populate("items.product")
      .populate("items.variant")
      .populate("items.batch");

    /* =====================================================
       HOLD BILL NOT AVAILABLE
    ===================================================== */

    if (!holdBill) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message:
          "Hold Bill is already converted or currently being converted",
      });
    }

    /* =====================================================
       ITEMS VALIDATION
    ===================================================== */

    if (
      !holdBill.items ||
      holdBill.items.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Hold Bill has no items",
      });
    }

    /* =====================================================
       PREPARE INVOICE ITEMS
    ===================================================== */

    const invoiceItems = [];

    for (const item of holdBill.items) {
      /* ===================================================
         PRODUCT
      =================================================== */

      const productId =
        item.product?._id || item.product;

      const product = await Product.findById(
        productId
      ).session(session);

      if (!product) {
        throw new Error(
          `${item.productName} not found`
        );
      }

      const quantity = Number(item.quantity);

      if (quantity <= 0) {
        throw new Error(
          `${item.productName} quantity must be greater than zero`
        );
      }

      /* ===================================================
         PRODUCT STOCK
      =================================================== */

      if (
        Number(product.totalStock) < quantity
      ) {
        throw new Error(
          `${item.productName} stock not available`
        );
      }

      /* ===================================================
         VARIANT
      =================================================== */

      let variantId = null;

      if (item.variant) {
        variantId =
          item.variant?._id || item.variant;

        const variant =
          await ProductVariant.findById(
            variantId
          ).session(session);

        if (!variant) {
          throw new Error(
            `${item.productName} variant not found`
          );
        }

        if (
          Number(variant.currentStock) <
          quantity
        ) {
          throw new Error(
            `${variant.variantName} stock not available`
          );
        }
      }

      /* ===================================================
         BATCH
      =================================================== */

      let batchId = null;

      if (item.batch) {
        batchId =
          item.batch?._id || item.batch;

        const batch =
          await Batch.findById(batchId)
            .session(session);

        if (!batch) {
          throw new Error(
            "Batch not found"
          );
        }

        if (
          Number(batch.remainingQuantity) <
          quantity
        ) {
          throw new Error(
            `Batch stock not available for ${item.productName}`
          );
        }
      }

      /* ===================================================
         INVOICE ITEM
      =================================================== */

      invoiceItems.push({
        product: productId,

        variant: variantId,

        batch: batchId,

        skuCode: item.skuCode,

        barcode: item.barcode,

        productName: item.productName,

        quantity,

        price: Number(item.salesPrice),

        discount: Number(
          item.discount || 0
        ),

        gstPercentage: Number(
          item.gstPercentage || 0
        ),
      });
    }

    /* =====================================================
       CREATE SALES INVOICE
       WITH RETRY FOR DUPLICATE INVOICE NUMBER
    ===================================================== */

    let salesInvoice = null;
    let invoiceCreated = false;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const invoiceNo =
          generateInvoiceNo();

        salesInvoice = new SalesInvoice({
          invoiceNo,

          customer:
            holdBill.customer,

          store:
            holdBill.store,

          warehouse:
            holdBill.warehouse,

          invoiceDate:
            new Date(),

          billingType:
            "POS",

          customerType:
            holdBill.customer
              ? "Registered"
              : "Walk-In",

          paymentMethod:
            "Cash",

          paidAmount:
            0,

          remarks:
            holdBill.remarks,

          items:
            invoiceItems,

          createdBy:
            req.user?._id ||
            req.user?.id,
        });

        await salesInvoice.save({
          session,
        });

        invoiceCreated = true;

        break;

      } catch (error) {
        /* -----------------------------------------------
           DUPLICATE INVOICE NUMBER
        ----------------------------------------------- */

        if (
          error.code === 11000 &&
          error.keyPattern?.invoiceNo
        ) {
          console.log(
            `Duplicate invoice number detected. Retrying... Attempt ${attempt}`
          );

          salesInvoice = null;

          continue;
        }

        throw error;
      }
    }

    /* =====================================================
       FAILED TO CREATE INVOICE
    ===================================================== */

    if (
      !invoiceCreated ||
      !salesInvoice
    ) {
      throw new Error(
        "Unable to generate a unique invoice number. Please try again."
      );
    }

    /* =====================================================
       DEDUCT STOCK
    ===================================================== */

    for (const item of invoiceItems) {
      const quantity =
        Number(item.quantity);

      /* -----------------------------------------------
         PRODUCT STOCK
      ----------------------------------------------- */

      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: item.product,

            totalStock: {
              $gte: quantity,
            },
          },
          {
            $inc: {
              totalStock: -quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!updatedProduct) {
        throw new Error(
          `${item.productName} stock became unavailable`
        );
      }

      /* -----------------------------------------------
         VARIANT STOCK
      ----------------------------------------------- */

      if (item.variant) {
        const updatedVariant =
          await ProductVariant.findOneAndUpdate(
            {
              _id: item.variant,

              currentStock: {
                $gte: quantity,
              },
            },
            {
              $inc: {
                currentStock: -quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!updatedVariant) {
          throw new Error(
            `${item.productName} variant stock became unavailable`
          );
        }
      }

      /* -----------------------------------------------
         BATCH STOCK
      ----------------------------------------------- */

      if (item.batch) {
        const updatedBatch =
          await Batch.findOneAndUpdate(
            {
              _id: item.batch,

              remainingQuantity: {
                $gte: quantity,
              },
            },
            {
              $inc: {
                remainingQuantity: -quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!updatedBatch) {
          throw new Error(
            `Batch stock became unavailable for ${item.productName}`
          );
        }
      }
    }

    /* =====================================================
       UPDATE HOLD BILL
    ===================================================== */

    holdBill.status =
      "Converted";

    holdBill.salesInvoice =
      salesInvoice._id;

    holdBill.updatedBy =
      req.user?._id ||
      req.user?.id;

    await holdBill.save({
      session,
    });

    /* =====================================================
       COMMIT TRANSACTION
    ===================================================== */

    await session.commitTransaction();
    session.endSession();

    /* =====================================================
       POPULATE INVOICE
    ===================================================== */

    const result =
      await SalesInvoice.findById(
        salesInvoice._id
      )
        .populate(
          "customer",
          "customerCode customerName phone"
        )
        .populate(
          "store",
          "storeCode storeName"
        )
        .populate(
          "warehouse",
          "warehouseCode warehouseName"
        )
        .populate(
          "createdBy",
          "firstName lastName"
        )
        .populate(
          "items.product",
          "productCode productName"
        )
        .populate(
          "items.variant",
          "variantName skuCode"
        )
        .populate(
          "items.batch",
          "batchNumber"
        );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.status(201).json({
      success: true,
      message:
        "Hold Bill converted to Sales Invoice successfully",
      data: result,
    });

  } catch (error) {
    /* =====================================================
       ROLLBACK
    ===================================================== */

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error(
      "Convert Hold Bill Error:",
      error
    );

    /* =====================================================
       DUPLICATE KEY ERROR
    ===================================================== */

    if (
      error.code === 11000 &&
      error.keyPattern?.invoiceNo
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Invoice number conflict. Please try converting the Hold Bill again.",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   DELETE HOLD BILL
========================================================= */

exports.deleteHoldBill = async (req, res) => {
  try {
    const holdBill = await HoldBill.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!holdBill) {
      return res.status(404).json({
        success: false,
        message: "Hold Bill not found",
      });
    }

    if (
      holdBill.status === "Converted" ||
      holdBill.status === "Converting"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Converted or currently converting Hold Bill cannot be deleted",
      });
    }

    holdBill.isDeleted = true;

    holdBill.updatedBy =
      req.user?._id ||
      req.user?.id;

    await holdBill.save();

    return res.status(200).json({
      success: true,
      message:
        "Hold Bill deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete Hold Bill Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};