const router = require("express").Router();

const {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  activateUnit,
} = require("../controllers/unitController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createUnit);

router.get("/all", verifyToken, getAllUnits);

router.get("/:id", verifyToken, getUnitById);

router.put("/update/:id", verifyToken, updateUnit);

router.patch("/activate/:id", verifyToken, activateUnit);

router.delete("/delete/:id", verifyToken, deleteUnit);

module.exports = router;