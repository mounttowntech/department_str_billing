const router = require("express").Router();
const c = require("../controllers/ProductController");

router.post("/create",  c.createProduct);
router.get("/all",  c.getAllProduct);
router.get("/:id",  c.getProductById);
router.put("/:id", c.updateProduct);
router.delete("/:id", c.deleteProduct);
module.exports = router;
