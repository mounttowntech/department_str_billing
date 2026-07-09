const router = require("express").Router();

const {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  activateWarehouse,
} = require("../controllers/WarehouseController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createWarehouse);
router.get("/all", verifyToken, getAllWarehouses);
router.get("/:id", verifyToken, getWarehouseById);
router.put("/update/:id", verifyToken, updateWarehouse);
router.patch("/activate/:id", verifyToken, activateWarehouse);
router.delete("/delete/:id", verifyToken, deleteWarehouse);

module.exports = router;