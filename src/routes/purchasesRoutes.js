const express = require("express");

const router = express.Router();

const {

  createPurchase,

  getPurchases,

  getPurchaseById,

  updatePurchase,

  deletePurchase,

  getTodayPurchases,

  getPendingPurchases,

  getPurchaseBySupplier,

} = require("../controllers/PurchaseController");

const { verifyToken } = require("../middleware/authMiddleware");

/* Purchase */

router.post("/create", verifyToken, createPurchase);

router.get("/all", verifyToken, getPurchases);

router.get("/today", verifyToken, getTodayPurchases);

router.get("/pending-payment", verifyToken, getPendingPurchases);

router.get("/supplier/:supplierId", verifyToken, getPurchaseBySupplier);

router.get("/:id", verifyToken, getPurchaseById);

router.put("/update/:id", verifyToken, updatePurchase);

router.delete("/delete/:id", verifyToken, deletePurchase);

module.exports = router;