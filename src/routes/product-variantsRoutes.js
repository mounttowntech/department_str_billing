const router = require("express").Router();
const c = require("../controllers/ProductVariantController");

router.post(
  "/create",
 
  c.createProductVariant,
);
router.get(
  "/all",
  
  c.getAllProductVariant,
);
router.get(
  "/:id",
  
  c.getProductVariantById,
);
router.put(
  "/:id",
 
  c.updateProductVariant,
);
router.delete(
  "/:id",

  c.deleteProductVariant,
);
module.exports = router;
