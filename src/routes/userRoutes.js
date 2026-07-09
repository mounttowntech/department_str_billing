const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  activateUser,
} = require("../controllers/userController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createUser);
router.get("/all", verifyToken, getUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/update/:id", verifyToken, updateUser);
router.patch("/block/:id", verifyToken, blockUser);
router.patch("/activate/:id", verifyToken, activateUser);
router.delete("/delete/:id", verifyToken, deleteUser);

module.exports = router;