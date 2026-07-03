const router = require("express").Router();
const c = require("../controllers/CouponController");

router.post("/create", c.createCoupon);
router.get("/all", c.getAllCoupon);
router.get("/:id",  c.getCouponById);
router.put("/:id", c.updateCoupon);
router.delete("/:id", c.deleteCoupon);
module.exports = router;
