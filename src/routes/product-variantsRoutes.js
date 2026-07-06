const express = require("express");
const router = express.Router();

const {
  createVariant,
  getVariants,
  getVariantById,
  updateVariant,
  deleteVariant,
  getLowStockVariants,
  getVariantByBarcode,
} = require("../controllers/ProductVariantController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createVariant);
router.get("/all", verifyToken, getVariants);
router.get("/low-stock", verifyToken, getLowStockVariants);
router.get("/barcode/:barcode", verifyToken, getVariantByBarcode);
router.get("/:id", verifyToken, getVariantById);
router.put("/:id", verifyToken, updateVariant);
router.delete("/:id", verifyToken, deleteVariant);

module.exports = router;