const router = require("express").Router();

const {
  createCustomerAddress,
  getAllCustomerAddress,
  getCustomerAddressById,
  updateCustomerAddress,
  toggleCustomerAddressStatus,
  deleteCustomerAddress,
} = require("../controllers/CustomerAddressController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createCustomerAddress);
router.get("/all", verifyToken, getAllCustomerAddress);
router.get("/:id", verifyToken, getCustomerAddressById);
router.put("/update/:id", verifyToken, updateCustomerAddress);
router.patch("/toggle-status/:id", verifyToken, toggleCustomerAddressStatus);
router.delete("/delete/:id", verifyToken, deleteCustomerAddress);

module.exports = router;