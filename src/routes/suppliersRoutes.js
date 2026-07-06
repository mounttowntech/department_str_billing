const router = require("express").Router();

const {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  activateSupplier,
} = require("../controllers/SupplierController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createSupplier);

router.get("/all", verifyToken, getAllSuppliers);

router.get("/:id", verifyToken, getSupplierById);

router.put("/update/:id", verifyToken, updateSupplier);

router.patch("/activate/:id", verifyToken, activateSupplier);

router.delete("/delete/:id", verifyToken, deleteSupplier);

module.exports = router;