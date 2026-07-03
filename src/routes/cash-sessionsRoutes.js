const router = require("express").Router();
const c = require("../controllers/CashSessionController");

router.post(
  "/create",
 
  c.createCashSession,
);
router.get("/all",  c.getAllCashSession);
router.get(
  "/:id",
  
  c.getCashSessionById,
);
router.put(
  "/:id",
 
  c.updateCashSession,
);
router.delete(
  "/:id",
  
  c.deleteCashSession,
);
module.exports = router;
