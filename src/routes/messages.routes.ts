import { Router } from "express";
import { requireAuth } from "../middlewares/validateAuth";
import { validate } from "../middlewares/validateInput";
import { getMessages } from "../validation/messages";
import { getMessagesController } from "../controllers/messages.controller";

const router = Router();
router.get("/:id", requireAuth, validate(getMessages), getMessagesController);

export default router;
