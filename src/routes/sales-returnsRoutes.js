const router = require("express").Router();
const c = require("../controllers/SalesReturnController");

router.post(
  "/create",
  
  c.createSalesReturn,
);
router.get("/all", c.getAllSalesReturn);
router.get(
  "/:id",
  
  c.getSalesReturnById,
);
router.put(
  "/:id",
  
  c.updateSalesReturn,
);
router.delete(
  "/:id",
  
  c.deleteSalesReturn,
);
module.exports = router;
