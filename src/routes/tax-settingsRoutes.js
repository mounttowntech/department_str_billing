const router = require("express").Router();
const c = require("../controllers/TaxSettingController");

router.post(
  "/create",
 
  c.createTaxSetting,
);
router.get("/all", c.getAllTaxSetting);
router.get(
  "/:id",
  
  c.getTaxSettingById,
);
router.put(
  "/:id",
  
  c.updateTaxSetting,
);
router.delete(
  "/:id",
 
  c.deleteTaxSetting,
);
module.exports = router;
