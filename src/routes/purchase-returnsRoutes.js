const express = require("express");
const router = express.Router();

const {
  createPurchaseReturn,
  getPurchaseReturns,
  getPurchaseReturnById,
  deletePurchaseReturn,
} = require("../controllers/purchaseReturnController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createPurchaseReturn);
router.get("/all", verifyToken, getPurchaseReturns);
router.get("/:id", verifyToken, getPurchaseReturnById);
router.delete("/:id", verifyToken, deletePurchaseReturn);

module.exports = router;