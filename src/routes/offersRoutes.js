const router = require("express").Router();
const controller = require("../controllers/OfferController");
const { verifyToken } = require("../middleware/authMiddleware");

// Create
router.post("/create", verifyToken, controller.createOffer);

// Apply offer check
router.post("/applicable", verifyToken, controller.getApplicableOffer);

// Get all & by ID
router.get("/all", verifyToken, controller.getAllOffer);
router.get("/:id", verifyToken, controller.getOfferById);

// Update
router.put("/update/:id", verifyToken, controller.updateOffer);

// Active / Deactivate toggle
router.patch("/toggle-status/:id", verifyToken, controller.toggleOfferStatus);

// Permanent Delete
router.delete("/delete/:id", verifyToken, controller.deleteOffer);

module.exports = router;