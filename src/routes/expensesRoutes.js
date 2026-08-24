const router = require("express").Router();
const c = require("../controllers/ExpenseController");
const { verifyToken } = require("../middleware/authMiddleware");

// Routes with authentication
router.post("/create", verifyToken, c.createExpense);
router.get("/all", verifyToken, c.getAllExpense);
router.get("/summary/report", verifyToken, c.getExpenseSummary);
router.get("/:id", verifyToken, c.getExpenseById);
router.put("/update/:id", verifyToken, c.updateExpense);
router.delete("/delete/:id", verifyToken, c.deleteExpense);
router.put("/approve/:id", verifyToken, c.approveExpense);
router.put("/reject/:id", verifyToken, c.rejectExpense);

module.exports = router;