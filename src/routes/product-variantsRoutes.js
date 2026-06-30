const router = require("express").Router();
const c = require("../controllers/ProductVariantController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("ProductVariant", "canCreate"),
  c.createProductVariant,
);
router.get(
  "/",
  checkPermission("ProductVariant", "canView"),
  c.getAllProductVariant,
);
router.get(
  "/:id",
  checkPermission("ProductVariant", "canView"),
  c.getProductVariantById,
);
router.put(
  "/:id",
  checkPermission("ProductVariant", "canEdit"),
  c.updateProductVariant,
);
router.delete(
  "/:id",
  checkPermission("ProductVariant", "canDelete"),
  c.deleteProductVariant,
);
module.exports = router;
