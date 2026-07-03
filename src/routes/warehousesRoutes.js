const router = require("express").Router();
const c = require("../controllers/WarehouseController");

router.post("/create",  c.createWarehouse);
router.get("/all", c.getAllWarehouse);
router.get("/:id", c.getWarehouseById);
router.put("/:id", c.updateWarehouse);
router.delete(
  "/:id",
  
  c.deleteWarehouse,
);
module.exports = router;
