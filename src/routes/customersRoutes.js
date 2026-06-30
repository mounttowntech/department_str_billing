const router = require("express").Router();
const c = require("../controllers/CustomerController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post("/", checkPermission("Customer", "canCreate"), c.createCustomer);
router.get("/", checkPermission("Customer", "canView"), c.getAllCustomer);
router.get("/:id", checkPermission("Customer", "canView"), c.getCustomerById);
router.put("/:id", checkPermission("Customer", "canEdit"), c.updateCustomer);
router.delete(
  "/:id",
  checkPermission("Customer", "canDelete"),
  c.deleteCustomer,
);
module.exports = router;
