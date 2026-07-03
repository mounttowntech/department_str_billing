const router = require("express").Router();
const c = require("../controllers/PaymentController");

router.post("/create",  c.createPayment);
router.get("/all",  c.getAllPayment);
router.get("/:id", c.getPaymentById);
router.put("/:id",  c.updatePayment);
router.delete("/:id",  c.deletePayment);
module.exports = router;
