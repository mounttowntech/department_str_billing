const router = require("express").Router();
const c = require("../controllers/CustomerAddressController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("CustomerAddress", "canCreate"),
  c.createCustomerAddress,
);
router.get(
  "/",
  checkPermission("CustomerAddress", "canView"),
  c.getAllCustomerAddress,
);
router.get(
  "/:id",
  checkPermission("CustomerAddress", "canView"),
  c.getCustomerAddressById,
);
router.put(
  "/:id",
  checkPermission("CustomerAddress", "canEdit"),
  c.updateCustomerAddress,
);
router.delete(
  "/:id",
  checkPermission("CustomerAddress", "canDelete"),
  c.deleteCustomerAddress,
);
module.exports = router;
