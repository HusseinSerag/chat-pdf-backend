import express from "express";
import multer, { memoryStorage } from "multer";
import { createChat, getChat, getChats } from "../controllers/chat.controller";
import { requireAuth } from "../middlewares/validateAuth";
import { getChatZod, getSingleZodChat } from "../validation/chat";
import { validate } from "../middlewares/validateInput";

const router = express.Router();

const storage = memoryStorage();
const upload = multer({ storage });

router.post("/", requireAuth, upload.single("pdf"), createChat);
router.get("/", requireAuth, validate(getChatZod), getChats);
router.get("/:id", requireAuth, getChat);

export default router;
