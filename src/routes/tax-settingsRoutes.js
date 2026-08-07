const express = require("express");

const router = express.Router();

const taxController = require("../controllers/taxSettingController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/create", verifyToken, taxController.createTaxSetting);

router.get("/all", verifyToken, taxController.getAllTaxSettings);

router.get("/:id", verifyToken, taxController.getTaxSettingById);

router.put("/update/:id", verifyToken, taxController.updateTaxSetting);

router.delete("/delete/:id", verifyToken, taxController.deleteTaxSetting);
module.exports = router;