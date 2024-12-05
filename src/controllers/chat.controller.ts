import { NextFunction, Request, Response } from "express";
import { UploadToS3, getS3Url } from "../utils/s3";
import { CustomError } from "../utils/CustomError";

import {
  createChatService,
  getChatsService,
  getSingleChat,
} from "../services/chat.service";
import { IRequest } from "../utils/types";
import {
  getResponse,
  getStoredVectors,
  loadS3IntoPinecone,
} from "../utils/pinecone";
import {
  GenerateResponse,
  GetChatType,
  GetSingleChatType,
} from "../validation/chat";
import { P } from "pino";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { messages as MessagesSchema } from "../schema/messages.schema";
import { db } from "../db";

export async function createChat(
  req: IRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const file = req.file;
    if (!file) {
      throw new CustomError("Please upload file!", 401);
    }
    const socketId = req.headers["socket-id"] as string;
    const { fileKey } = await UploadToS3(file, socketId);
    await loadS3IntoPinecone(fileKey);

    const chat = await createChatService(
      fileKey,
      file.originalname,
      req.user!.id
    );
    res.status(200).json({
      data: {
        chatId: chat[0].id,
      },
    });
  } catch (e) {
    next(e);
  }
}
export async function getChat(
  req: IRequest<GetSingleChatType["params"]>,
  res: Response,
  next: NextFunction
) {
  const userId = req.auth!.userId!;
  const {
    params: { id },
  } = req;
  try {
    const chat = await getSingleChat(userId, id);

    res.status(200).json({
      data: {
        chat: chat,
      },
    });
  } catch (e) {
    next(e);
  }
}
export async function getChats(
  req: IRequest<{}, {}, {}, GetChatType["query"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId!;
    const { query } = req;
    const {
      offset = 10,
      page = 10,
      direction = "asc",
      sort = "createdAt",
      ...rest
    } = query;

    //const userId = "user_2pWdNcVMa7Xl55GY5qE6O0yG816";
    const chats = await getChatsService(
      {
        userId,
        ...rest,
      },
      offset,
      page,
      direction,
      sort
    );
    res.status(200).json({
      data: {
        chats: chats,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function generateText(
  req: IRequest<{}, {}, GenerateResponse["body"]>,
  res: Response,
  next: NextFunction
) {
  try {
    const { messages, fileKey, chatId } = req.body;
    // const chats = await db.select().from(messages).where(
    //   and(
    //     eq(messages.chatId, chatId)
    //   )
    // ).orderBy(messages.createdAt)

    const response = await getResponse(messages, fileKey);

    let isFirst = true;
    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages: response,
      onFinish: async (e) => {
        //TODO: save AI response

        await db.insert(MessagesSchema).values({
          chatId: chatId,
          content: e.text,
          role: "system",
        });
      },
      onChunk: async () => {
        if (isFirst) {
          isFirst = false;
          // TODO: save our response
          await db.insert(MessagesSchema).values({
            chatId: chatId,
            content: messages[messages.length - 1].content,
            role: "user",
          });
        }
      },
    });

    result.pipeTextStreamToResponse(res);
  } catch (e) {
    throw next(e);
  }
}
