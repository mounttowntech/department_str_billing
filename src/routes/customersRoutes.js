const router = require("express").Router();

const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  blockCustomer,
  activateCustomer,
} = require("../controllers/CustomerController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createCustomer);
router.get("/all", verifyToken, getAllCustomers);
router.get("/:id", verifyToken, getCustomerById);
router.put("/update/:id", verifyToken, updateCustomer);
router.patch("/block/:id", verifyToken, blockCustomer);
router.patch("/activate/:id", verifyToken, activateCustomer);
router.delete("/delete/:id", verifyToken, deleteCustomer);

module.exports = router;