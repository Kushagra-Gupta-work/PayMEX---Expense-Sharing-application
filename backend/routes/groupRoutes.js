import { Router } from "express";
import { createGroup, getMyGroups, getGroupById, addMember, deleteGroup } from "../controllers/groupController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All group routes require a valid logged-in user
router.use(protect);

router.post("/",                    createGroup);
router.get("/",                     getMyGroups);
router.get("/:groupId",             getGroupById);
router.post("/:groupId/members",    addMember);
router.delete("/:groupId",          deleteGroup);

export default router;
