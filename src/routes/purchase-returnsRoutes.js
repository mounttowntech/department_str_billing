const router = require("express").Router();
const c = require("../controllers/PurchaseReturnController");

router.post(
  "/create",
  
  c.createPurchaseReturn,
);
router.get(
  "/all",
  
  c.getAllPurchaseReturn,
);
router.get(
  "/:id",
  
  c.getPurchaseReturnById,
);
router.put(
  "/:id",
  
  c.updatePurchaseReturn,
);
router.delete(
  "/:id",
 
  c.deletePurchaseReturn,
);
module.exports = router;
