const router = require("express").Router();
const c = require("../controllers/StockAdjustmentController");

router.post(
  "/create",
 
  c.createStockAdjustment,
);
router.get(
  "/all",
  
  c.getAllStockAdjustment,
);
router.get(
  "/:id",
  
  c.getStockAdjustmentById,
);
router.put(
  "/:id",
  
  c.updateStockAdjustment,
);
router.delete(
  "/:id",
  
  c.deleteStockAdjustment,
);
module.exports = router;
