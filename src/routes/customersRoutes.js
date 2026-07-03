const router = require("express").Router();
const c = require("../controllers/CustomerController");

router.post("/create",  c.createCustomer);
router.get("/all",  c.getAllCustomer);
router.get("/:id", c.getCustomerById);
router.put("/:id",  c.updateCustomer);
router.delete(
  "/:id",
  c.deleteCustomer,
);
module.exports = router;
