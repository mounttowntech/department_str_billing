const mongoose = require("mongoose");

const HoldBill = require("../models/HoldBill");
const SalesInvoice = require("../models/SalesInvoice"); // <-- ADD THIS
const Customer = require("../models/Customer");
const Store = require("../models/Store");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");
const Batch = require("../models/Batch");
/* ==========================================
   Generate Hold Number
========================================== */

const generateHoldNo = async () => {
  const lastHold = await HoldBill.findOne()
    .sort({ createdAt: -1 })
    .select("holdNo");

  let nextNumber = 1;

  if (lastHold && lastHold.holdNo) {
    const number = parseInt(lastHold.holdNo.replace("HB", "")) || 0;
    nextNumber = number + 1;
  }

  return `HB${String(nextNumber).padStart(6, "0")}`;
};

/* ==========================================
   Create Hold Bill
========================================== */

exports.createHoldBill = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { customer, store, cashier, remarks, items } = req.body;

    /* ===========================
       Required Validation
    =========================== */

    if (!store) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Store is required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    /* ===========================
       Generate Hold Number
    =========================== */

    const holdNo = await generateHoldNo();

    /* ===========================
       Customer Validation
    =========================== */

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

    /* ===========================
       Store Validation
    =========================== */

    const storeData = await Store.findById(store).session(session);

    if (!storeData) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    /* ===========================
       Validate Items
    =========================== */

    const holdItems = [];

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
        const variant = await ProductVariant.findById(item.variant).session(
          session,
        );

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

    /* ===========================
       Create Hold Bill
    =========================== */

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

    /* ===========================
       Populate Response
    =========================== */

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
    await session.abortTransaction();
    session.endSession();

    console.error("Create Hold Bill Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

    /* ===============================

       Pagination

    =============================== */

    const pageNumber = Math.max(parseInt(page), 1);

    const pageSize = Math.max(parseInt(limit), 1);

    const skip = (pageNumber - 1) * pageSize;

    /* ===============================

       Filters

    =============================== */

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

    /* ===============================

       Date Filter

    =============================== */

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

    /* ===============================

       Search

    =============================== */

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

    /* ===============================

       Sorting

    =============================== */

    const sort = {};

    sort[sortBy] = order === "asc" ? 1 : -1;

    /* ===============================

       Fetch Data

    =============================== */

    const holdBills = await HoldBill.find(filter)

      .populate("customer", "customerCode customerName phone")

      .populate("store", "storeCode storeName")

      .populate("cashier", "firstName lastName")

      .populate("salesInvoice", "invoiceNo grandTotal")

      .populate("createdBy", "firstName lastName")

      .populate("items.product", "productCode productName")

      .populate("items.variant", "variantName skuCode")

      .populate("items.batch", "batchNumber")

      .sort(sort)

      .skip(skip)

      .limit(pageSize);

    /* ===============================

       Total Count

    =============================== */

    const totalRecords = await HoldBill.countDocuments(filter);

    /* ===============================

       Response

    =============================== */

    return res.status(200).json({
      success: true,

      message: "Hold Bills fetched successfully",

      pagination: {
        currentPage: pageNumber,

        perPage: pageSize,

        totalRecords,

        totalPages: Math.ceil(totalRecords / pageSize),

        hasNextPage: pageNumber < Math.ceil(totalRecords / pageSize),

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
/* ==========================================
   Get Hold Bill By ID
========================================== */

exports.getHoldBillById = async (req, res) => {
  try {
    const holdBill = await HoldBill.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("customer", "customerCode customerName phone")
      .populate("store", "storeCode storeName")
      .populate("cashier", "firstName lastName")
      .populate("salesInvoice", "invoiceNo grandTotal")
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName")
      .populate("items.product", "productCode productName")
      .populate("items.variant", "variantName skuCode")
      .populate("items.batch", "batchNumber");

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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ==========================================
   Update Hold Bill
========================================== */

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

    const { customer, store, cashier, remarks, status, items } = req.body;

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

      holdBill.customer = customer;
    }

    if (store) {
      const storeData = await Store.findById(store).session(session);

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

    if (Array.isArray(items)) {
      const updatedItems = [];

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
          const variant = await ProductVariant.findById(item.variant).session(
            session,
          );

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

    holdBill.updatedBy = req.user?._id || req.user?.id;

    await holdBill.save({ session });

    await session.commitTransaction();
    session.endSession();

    const result = await HoldBill.findById(holdBill._id)
      .populate("customer", "customerCode customerName")
      .populate("store", "storeName")
      .populate("cashier", "firstName lastName")
      .populate("items.product", "productName productCode");

    return res.status(200).json({
      success: true,
      message: "Hold Bill updated successfully",
      data: result,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* ==========================================
   Generate Invoice Number
========================================== */

const generateInvoiceNo = async () => {

  const lastInvoice = await SalesInvoice
    .findOne()
    .sort({ createdAt: -1 })
    .select("invoiceNo");

  let nextNumber = 1;

  if (lastInvoice && lastInvoice.invoiceNo) {

    const number = parseInt(
      lastInvoice.invoiceNo.replace(/\D/g, "")
    );

    nextNumber = (number || 0) + 1;
  }

  return `INV${String(nextNumber).padStart(6, "0")}`;
};

/* ==========================================
   Convert Hold Bill To Sales Invoice
========================================== */

exports.convertHoldBillToInvoice = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    /* ==========================================
       Load Hold Bill
    ========================================== */

    const holdBill = await HoldBill.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("items.product")
      .populate("items.variant")
      .populate("items.batch")
      .session(session);

    if (!holdBill) {

      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Hold Bill not found",
      });

    }

    /* ==========================================
       Already Converted
    ========================================== */

    if (holdBill.status === "Converted") {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Hold Bill already converted",
      });

    }

    if (holdBill.salesInvoice) {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Sales Invoice already generated for this Hold Bill",
      });

    }

    /* ==========================================
       Items Validation
    ========================================== */

    if (!holdBill.items || holdBill.items.length === 0) {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Hold Bill has no items",
      });

    }

    /* ==========================================
       Generate Invoice Number
    ========================================== */

    const invoiceNo = await generateInvoiceNo();

/* ==========================================
   Validate Stock & Prepare Invoice Items
========================================== */

const invoiceItems = [];

for (const item of holdBill.items) {

  /* ===============================
     Product Validation
  =============================== */

  const product = await Product.findById(item.product._id).session(session);

  if (!product) {

    await session.abortTransaction();
    session.endSession();

    return res.status(404).json({
      success: false,
      message: `${item.productName} not found`,
    });

  }

  if (product.totalStock < Number(item.quantity)) {

    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: `${item.productName} stock not available`,
    });

  }

  /* ===============================
     Variant Validation
  =============================== */

  if (item.variant) {

    const variant = await ProductVariant.findById(
      item.variant._id || item.variant
    ).session(session);

    if (!variant) {

      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: `${item.productName} variant not found`,
      });

    }

    if (variant.currentStock < Number(item.quantity)) {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: `${variant.variantName} stock not available`,
      });

    }

  }

  /* ===============================
     Batch Validation
  =============================== */

  if (item.batch) {

    const batch = await Batch.findById(
      item.batch._id || item.batch
    ).session(session);

    if (!batch) {

      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });

    }

    if (batch.remainingQuantity < Number(item.quantity)) {

      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: `Batch stock not available for ${item.productName}`,
      });

    }

  }

  /* ===============================
     Prepare Invoice Item
  =============================== */

  invoiceItems.push({

    product: item.product._id || item.product,

    variant: item.variant
      ? item.variant._id || item.variant
      : null,

    batch: item.batch
      ? item.batch._id || item.batch
      : null,

    skuCode: item.skuCode,

    barcode: item.barcode,

    productName: item.productName,

    quantity: Number(item.quantity),

    price: Number(item.salesPrice),

    discount: Number(item.discount || 0),

    gstPercentage: Number(item.gstPercentage || 0),

  });

}

/* ==========================================
   Create Sales Invoice
========================================== */

const salesInvoice = new SalesInvoice({

  invoiceNo,

  customer: holdBill.customer,

  store: holdBill.store,

  warehouse: holdBill.warehouse,

  invoiceDate: new Date(),

  billingType: "POS",

  customerType: holdBill.customer
    ? "Registered"
    : "Walk-In",

  paymentMethod: "Cash",

  paidAmount: 0,

  remarks: holdBill.remarks,

  items: invoiceItems,

  createdBy: req.user?._id || req.user?.id,

});

await salesInvoice.save({ session });

/* ==========================================
   Deduct Product Stock
========================================== */

for (const item of invoiceItems) {

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
   Update Hold Bill
========================================== */

holdBill.status = "Converted";

holdBill.salesInvoice = salesInvoice._id;

holdBill.updatedBy = req.user?._id || req.user?.id;

await holdBill.save({ session });

/* ==========================================
   Commit Transaction
========================================== */

await session.commitTransaction();

session.endSession();

/* ==========================================
   Populate Invoice
========================================== */

const result = await SalesInvoice.findById(
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

/* ==========================================
   Response
========================================== */

return res.status(201).json({

  success: true,

  message: "Hold Bill converted to Sales Invoice successfully",

  data: result,

});

} catch (error) {

  if (session.inTransaction()) {
    await session.abortTransaction();
  }

  session.endSession();

  console.error(
    "Convert Hold Bill Error:",
    error
  );

  return res.status(500).json({

    success: false,

    message: error.message,

  });

}
};
/* ==========================================
   Delete Hold Bill
========================================== */

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

    if (holdBill.status === "Converted") {
      return res.status(400).json({
        success: false,
        message: "Converted Hold Bill cannot be deleted",
      });
    }

    holdBill.isDeleted = true;

    holdBill.updatedBy = req.user?._id || req.user?.id;

    await holdBill.save();

    return res.status(200).json({
      success: true,
      message: "Hold Bill deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
