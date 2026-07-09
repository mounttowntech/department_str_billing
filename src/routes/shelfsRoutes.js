const router = require("express").Router();

const {
  createShelf,
  getAllShelf,
  getShelfById,
  updateShelf,
  deleteShelf,
  activateShelf,
} = require("../controllers/ShelfController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createShelf);
router.get("/all", verifyToken, getAllShelf);
router.get("/:id", verifyToken, getShelfById);
router.put("/update/:id", verifyToken, updateShelf);
router.patch("/activate/:id", verifyToken, activateShelf);
router.delete("/delete/:id", verifyToken, deleteShelf);

module.exports = router;