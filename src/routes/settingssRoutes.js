const router = require("express").Router();

const c = require("../controllers/SettingsController");

router.post("/create", c.createSettings);

router.get("/all", c.getAllSettings);

router.get("/store/:storeId", c.getSettingsByStore);

router.get("/:id", c.getSettingsById);

router.put("/update/:id", c.updateSettings);

router.delete("/delete/:id", c.deleteSettings);

module.exports = router;