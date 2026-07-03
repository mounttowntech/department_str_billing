const router = require("express").Router();
const c = require("../controllers/HoldBillController");
router.post("/create", c.createHoldBill);
router.get("/all",  c.getAllHoldBill);
router.get("/:id", c.getHoldBillById);
router.put("/:id",  c.updateHoldBill);
router.delete(
  "/:id",
 
  c.deleteHoldBill,
);
module.exports = router;
