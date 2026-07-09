const router = require("express").Router();
const c = require("../controllers/LoyaltyPointsController");

router.post("/create", c.createLoyaltyPoints);

router.get("/all", c.getAllLoyaltyPoints);

router.get("/:id", c.getLoyaltyPointsById);

router.put("/update/:id", c.updateLoyaltyPoints);

router.delete("/delete/:id", c.deleteLoyaltyPoints);

module.exports = router;