const router = require("express").Router();
const c = require("../controllers/CashSessionController");
const { verifyToken} = require("../middleware/authMiddleware"); // adjust to your actual middleware names

router.post("/create", verifyToken, c.createCashSession);
router.get("/all", verifyToken, c.getAllCashSession);
router.get("/:id", verifyToken, c.getCashSessionById);
router.put("/update/:id", verifyToken, c.updateCashSession);
router.delete("/delete/:id", verifyToken, c.deleteCashSession);

module.exports = router;