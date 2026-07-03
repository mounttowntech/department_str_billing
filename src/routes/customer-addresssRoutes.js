const router = require("express").Router();
const c = require("../controllers/CustomerAddressController");

router.post(
  "/create",
 
  c.createCustomerAddress,
);
router.get(
  "/all",
  
  c.getAllCustomerAddress,
);
router.get(
  "/:id",
  
  c.getCustomerAddressById,
);
router.put(
  "/:id",
 
  c.updateCustomerAddress,
);
router.delete(
  "/:id",
  
  c.deleteCustomerAddress,
);
module.exports = router;
