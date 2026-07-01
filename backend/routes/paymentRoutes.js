import { Router } from "express";
import { recordPayment, getGroupPayments, deletePayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All payment routes require a valid logged-in user
router.use(protect);

router.post("/:groupId/payments", recordPayment);
router.get("/:groupId/payments", getGroupPayments);
router.delete("/:groupId/payments/:paymentId", deletePayment);

export default router;
