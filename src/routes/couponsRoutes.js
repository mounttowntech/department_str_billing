const router = require("express").Router();
const controller = require("../controllers/CouponController");

router.post("/create", controller.createCoupon);

router.get("/all", controller.getAllCoupon);

router.get("/:id", controller.getCouponById);

router.put("/update/:id", controller.updateCoupon);

router.delete("/delete/:id", controller.deleteCoupon);

module.exports = router;