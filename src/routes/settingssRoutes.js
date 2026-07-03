const router = require("express").Router();
const c = require("../controllers/SettingsController");

router.post("/create",  c.createSettings);
router.get("/all",  c.getAllSettings);
router.get("/:id", c.getSettingsById);
router.put("/:id", c.updateSettings);
router.delete(
  "/:id",
  
  c.deleteSettings,
);
module.exports = router;
