const router = require("express").Router();
const c = require("../controllers/OfferController");

router.post("/create",  c.createOffer);
router.get("/all",c.getAllOffer);
router.get("/:id",  c.getOfferById);
router.put("/:id", c.updateOffer);
router.delete("/:id",  c.deleteOffer);
module.exports = router;
