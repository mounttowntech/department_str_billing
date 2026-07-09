const router = require("express").Router();

const c = require("../controllers/ExpenseController");

// Create Expense
router.post("/create", c.createExpense);

// Get All Expense
router.get("/all", c.getAllExpense);

// Get Expense By Id
router.get("/:id", c.getExpenseById);

// Update Expense
router.put("/update/:id", c.updateExpense);

// Delete Expense (Soft Delete)
router.delete("/delete/:id", c.deleteExpense);

// Approve Expense
router.put("/approve/:id", c.approveExpense);

// Reject Expense
router.put("/reject/:id", c.rejectExpense);

// Expense Summary Report
router.get("/summary/report", c.getExpenseSummary);

module.exports = router;
