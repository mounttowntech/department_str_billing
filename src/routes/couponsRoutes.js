const router = require("express").Router();
const controller = require("../controllers/CouponController");
const { verifyToken } = require("../middleware/authMiddleware");

// Apply verifyToken to all routes
router.post("/create", verifyToken, controller.createCoupon);
router.get("/all", verifyToken, controller.getAllCoupon);
router.get("/:id", verifyToken, controller.getCouponById);
router.put("/update/:id", verifyToken, controller.updateCoupon);
router.patch("/toggle-status/:id", verifyToken, controller.toggleCouponStatus);
router.delete("/delete/:id", verifyToken, controller.deleteCoupon);

module.exports = router;