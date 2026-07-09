const router = require("express").Router();
const c = require("../controllers/StockAdjustmentController");
const { verifyToken} = require("../middleware/authMiddleware"); 

router.post("/create", verifyToken, c.createStockAdjustment);
router.get("/all", verifyToken, c.getAllStockAdjustment);
router.get("/:id", verifyToken, c.getStockAdjustmentById);
router.put("/update/:id", verifyToken, c.updateStockAdjustment);
router.delete("/delete/:id", verifyToken, c.deleteStockAdjustment);

module.exports = router;