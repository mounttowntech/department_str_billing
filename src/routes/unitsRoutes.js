const router = require("express").Router();
const c = require("../controllers/UnitController");

router.post("/create",  c.createUnit);
router.get("/all",  c.getAllUnit);
router.get("/:id",  c.getUnitById);
router.put("/:id",  c.updateUnit);
router.delete("/:id", c.deleteUnit);
module.exports = router;
