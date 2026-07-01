import { Router } from "express";
import { addExpense, getGroupExpenses, deleteExpense, getGroupBalances } from "../controllers/expenseController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All expense routes require a valid logged-in user
router.use(protect);

router.post("/:groupId/expenses",                    addExpense);
router.get("/:groupId/expenses",                     getGroupExpenses);
router.delete("/:groupId/expenses/:expenseId",       deleteExpense);
router.get("/:groupId/balances",                     getGroupBalances);

export default router;
