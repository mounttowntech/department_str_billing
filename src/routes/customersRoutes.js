const router = require("express").Router();

const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  blockCustomer,
  activateCustomer,
  toggleCustomerStatus,
  syncCustomerDueAmounts, // 1. Import the sync function
} = require("../controllers/CustomerController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createCustomer);
router.get("/all", verifyToken, getAllCustomers);

// 2. Place this sync route BEFORE the /:id route so Express doesn't treat "sync-due-amounts" as an ID
router.get("/sync-due-amounts", verifyToken, syncCustomerDueAmounts);

router.get("/:id", verifyToken, getCustomerById);
router.put("/update/:id", verifyToken, updateCustomer);
router.patch("/block/:id", verifyToken, blockCustomer);
router.patch("/activate/:id", verifyToken, activateCustomer);
router.put("/toggle-status/:id", verifyToken, toggleCustomerStatus);
router.delete("/delete/:id", verifyToken, deleteCustomer);

module.exports = router;