const router = require("express").Router();
const c = require("../controllers/BarcodeController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, c.createBarcode);
router.get("/all", verifyToken, c.getAllBarcode);
router.get("/:id", verifyToken, c.getBarcodeById);
router.put("/update/:id", verifyToken, c.updateBarcode);
router.delete("/delete/:id", verifyToken, c.deleteBarcode);

module.exports = router;