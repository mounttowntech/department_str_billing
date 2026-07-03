const router = require("express").Router();
const c = require("../controllers/StockTransferController");

router.post(
  "/create",
 
  c.createStockTransfer,
);
router.get(
  "/all",
 
  c.getAllStockTransfer,
);
router.get(
  "/:id",
  
  c.getStockTransferById,
);
router.put(
  "/:id",
  
  c.updateStockTransfer,
);
router.delete(
  "/:id",
  
  c.deleteStockTransfer,
);
module.exports = router;
