const router = require("express").Router();
const c = require("../controllers/SupplierController");

router.post("/create", c.createSupplier);
router.get("/all", c.getAllSupplier);
router.get("/:id",  c.getSupplierById);
router.put("/:id",  c.updateSupplier);
router.delete(
  "/:id",
  
  c.deleteSupplier,
);
module.exports = router;
