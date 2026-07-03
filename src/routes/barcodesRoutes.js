const router = require("express").Router();
const c = require("../controllers/BarcodeController");

router.post("/create",c.createBarcode);
router.get("/all", c.getAllBarcode);
router.get("/:id", c.getBarcodeById);
router.put("/:id",  c.updateBarcode);
router.delete("/:id",c.deleteBarcode);
module.exports = router;
