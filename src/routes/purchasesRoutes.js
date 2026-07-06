const express = require("express");
const router = express.Router();

const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createPurchase);
router.get("/all", verifyToken, getPurchases);
router.get("/:id", verifyToken, getPurchaseById);
router.put("/:id", verifyToken, updatePurchase);
router.delete("/:id", verifyToken, deletePurchase);

module.exports = router;