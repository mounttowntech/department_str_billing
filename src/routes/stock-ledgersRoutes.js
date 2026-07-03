const router = require("express").Router();
const c = require("../controllers/StockLedgerController");

router.post(
  "/create",
 
  c.createStockLedger,
);
router.get("/all",  c.getAllStockLedger);
router.get(
  "/:id",
  
  c.getStockLedgerById,
);
router.put(
  "/:id",
  
  c.updateStockLedger,
);
router.delete(
  "/:id",
  
  c.deleteStockLedger,
);
module.exports = router;
