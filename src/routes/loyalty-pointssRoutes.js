const router = require("express").Router();
const c = require("../controllers/LoyaltyPointsController");

router.post("/create", c.createLoyaltyPoints);

router.get("/all", c.getAllLoyaltyPoints);

// Add this sync route here before the :id route
router.get("/sync-points", c.syncCustomerLoyaltyPoints);

router.get("/:id", c.getLoyaltyPointsById);

router.put("/update/:id", c.updateLoyaltyPoints);

router.delete("/delete/:id", c.deleteLoyaltyPoints);

module.exports = router;