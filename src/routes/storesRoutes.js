const router = require("express").Router();
const c = require("../controllers/StoreController");

router.post("/create", c.createStore);
router.get("/all", 
    
    c.getAllStore);
router.get("/:id", 
    
    c.getStoreById);
router.put("/update/:id", 
    
    c.updateStore);
router.delete("/delete/:id", 
   
    c.deleteStore);
module.exports = router;
