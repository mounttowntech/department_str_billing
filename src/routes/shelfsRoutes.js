const router = require("express").Router();
const c = require("../controllers/ShelfController");

router.post("/create", c.createShelf);
router.get("/all", c.getAllShelf);
router.get("/:id", c.getShelfById);
router.put("/:id", c.updateShelf);
router.delete("/:id", c.deleteShelf);
module.exports = router;
