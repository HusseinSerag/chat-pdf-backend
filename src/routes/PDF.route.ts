import express from "express";
import multer, { memoryStorage } from "multer";
import { createChat, generateText, getChat, getChats } from "../controllers/chat.controller";
import { requireAuth } from "../middlewares/validateAuth";
import { GenerateBody, getChatZod, getSingleZodChat } from "../validation/chat";
import { validate } from "../middlewares/validateInput";

const router = express.Router();

const storage = memoryStorage();
const upload = multer({ storage });

router.post("/", requireAuth, upload.single("pdf"), createChat);
router.get("/", requireAuth, validate(getChatZod), getChats);
router.get("/:id", requireAuth,validate(getSingleZodChat), getChat);
router.post('/generate',requireAuth,validate(GenerateBody), generateText)

export default router;
