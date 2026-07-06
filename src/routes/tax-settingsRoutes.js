const express = require("express");

const router = express.Router();

const taxController = require("../controllers/taxSettingController");

// Create
router.post("/create", taxController.createTaxSetting);

// Get All
router.get("/all", taxController.getAllTaxSettings);

// Get By Id
router.get("/:id", taxController.getTaxSettingById);

// Update
router.put("/update/:id", taxController.updateTaxSetting);

// Delete
router.delete("/delete/:id", taxController.deleteTaxSetting);

module.exports = router;