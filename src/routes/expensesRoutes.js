const router = require("express").Router();
const c = require("../controllers/ExpenseController");

router.post("/create",  c.createExpense);
router.get("/all",  c.getAllExpense);
router.get("/:id",  c.getExpenseById);
router.put("/:id", c.updateExpense);
router.delete("/:id",  c.deleteExpense);
module.exports = router;
