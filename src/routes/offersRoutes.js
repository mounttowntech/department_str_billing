const router = require("express").Router();
const controller = require("../controllers/OfferController");

router.post("/create", controller.createOffer);
// Apply Offer
router.post("/applicable", controller.getApplicableOffer);
router.get("/all", controller.getAllOffer);

router.get("/:id", controller.getOfferById);

router.put("/update/:id", controller.updateOffer);

router.delete("/delete/:id", controller.deleteOffer);



module.exports = router;