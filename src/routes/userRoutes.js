const router = require("express").Router();
const c = require("../controllers/UserController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.post("/login", c.login);
router.post("/register", c.register);
router.get("/me", protect, c.me);
router.post("/", protect, checkPermission("User", "canCreate"), c.createUser);
router.get("/", protect, checkPermission("User", "canView"), c.getAllUser);
router.get("/:id", protect, checkPermission("User", "canView"), c.getUserById);
router.put("/:id", protect, checkPermission("User", "canEdit"), c.updateUser);
router.delete(
  "/:id",
  protect,
  checkPermission("User", "canDelete"),
  c.deleteUser,
);
module.exports = router;
