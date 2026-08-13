const router = require("express").Router();

const {
  createShelf,
  getAllShelf,
  getShelfById,
  updateShelf,
  toggleShelfStatus,
  deleteShelf,
} = require("../controllers/ShelfController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createShelf);
router.get("/all", verifyToken, getAllShelf);
router.get("/:id", verifyToken, getShelfById);
router.put("/update/:id", verifyToken, updateShelf);

// Same naming convention as Category/Brand/Warehouse: mounted at
// /activate/:id even though it flips active <-> inactive either way.
router.patch("/activate/:id", verifyToken, toggleShelfStatus);

router.delete("/delete/:id", verifyToken, deleteShelf);

module.exports = router;