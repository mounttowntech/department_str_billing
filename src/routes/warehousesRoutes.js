const router = require("express").Router();

const {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  toggleWarehouseStatus,
  deleteWarehouse,
} = require("../controllers/WarehouseController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createWarehouse);
router.get("/all", verifyToken, getAllWarehouses);
router.get("/:id", verifyToken, getWarehouseById);
router.put("/update/:id", verifyToken, updateWarehouse);

// Same naming quirk as Category/Brand: mounted at /activate/:id even
// though the handler flips active <-> inactive either way.
router.patch("/activate/:id", verifyToken, toggleWarehouseStatus);

router.delete("/delete/:id", verifyToken, deleteWarehouse);

module.exports = router;