import { NextFunction, Response } from "express";
import { IRequest } from "../utils/types";
import { GetMessages } from "../validation/messages";
import { db } from "../db";
import { messages } from "../schema/messages.schema";
import { eq } from "drizzle-orm";

export async function getMessagesController(
  req: IRequest<GetMessages["params"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const foundMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id));
    res.status(200).json({
      status: "success",
      data: {
        messages: foundMessages,
      },
    });
  } catch (e) {
    next(e);
  }
}
