const router = require("express").Router();
const c = require("../controllers/LoyaltyPointsController");
const { protect, checkPermission } = require("../middleware/authMiddleware");
router.use(protect);
router.post(
  "/",
  checkPermission("LoyaltyPoints", "canCreate"),
  c.createLoyaltyPoints,
);
router.get(
  "/",
  checkPermission("LoyaltyPoints", "canView"),
  c.getAllLoyaltyPoints,
);
router.get(
  "/:id",
  checkPermission("LoyaltyPoints", "canView"),
  c.getLoyaltyPointsById,
);
router.put(
  "/:id",
  checkPermission("LoyaltyPoints", "canEdit"),
  c.updateLoyaltyPoints,
);
router.delete(
  "/:id",
  checkPermission("LoyaltyPoints", "canDelete"),
  c.deleteLoyaltyPoints,
);
module.exports = router;
