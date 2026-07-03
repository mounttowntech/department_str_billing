const router = require("express").Router();
const c = require("../controllers/BatchController");


router.post("/create", c.createBatch);
router.get("/all", c.getAllBatch);
router.get("/:id", c.getBatchById);
router.put("/:id",  c.updateBatch);
router.delete("/:id", c.deleteBatch);
module.exports = router;
