const router = require("express").Router();

const {
  createCustomerAddress,
  getAllCustomerAddress,
  getCustomerAddressById,
  updateCustomerAddress,
  deleteCustomerAddress,
  activateCustomerAddress,
} = require("../controllers/CustomerAddressController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createCustomerAddress);
router.get("/all", verifyToken, getAllCustomerAddress);
router.get("/:id", verifyToken, getCustomerAddressById);
router.put("/update/:id", verifyToken, updateCustomerAddress);
router.patch("/activate/:id", verifyToken, activateCustomerAddress);
router.delete("/delete/:id", verifyToken, deleteCustomerAddress);

module.exports = router;