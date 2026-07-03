const router = require("express").Router();
const c = require("../controllers/PurchaseController");

router.post("/create",  c.createPurchase);
router.get("/all",c.getAllPurchase);
router.get("/:id",  c.getPurchaseById);
router.put("/:id",  c.updatePurchase);
router.delete(
  "/:id",
  
  c.deletePurchase,
);
module.exports = router;
