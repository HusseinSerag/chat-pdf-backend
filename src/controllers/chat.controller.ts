import { NextFunction, Request, Response } from "express";
import { UploadToS3, getS3Url } from "../utils/s3";
import { CustomError } from "../utils/CustomError";

import {
  createChatService,
  generateTextAi,
  getChatsService,
  getSingleChat,
} from "../services/chat.service";
import { IRequest } from "../utils/types";
import { getStoredVectors, loadS3IntoPinecone } from "../utils/pinecone";
import {
  GenerateResponse,
  GetChatType,
  GetSingleChatType,
} from "../validation/chat";
import { P } from "pino";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { messages } from "../schema/messages.schema";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { getEmbedding } from "../utils/embeddings";

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
    const { messages: passedMessages, fileKey, chatId } = req.body;
    // const chats = await db.select().from(messages).where(
    //   and(
    //     eq(messages.chatId, chatId)
    //   )
    // ).orderBy(messages.createdAt)

    const lastMessages = passedMessages.at(passedMessages.length - 1);
    const queryEmbedding = await getEmbedding(lastMessages!.content);
    const matches = getStoredVectors(fileKey, queryEmbedding);
    type MetaData = {
      text: string;
      pageNumber: number;
    };
    const qualifyingDocs = (await matches).filter(
      (match) => match.score && match.score > 0.7
    );
    let doc = qualifyingDocs
      .map((match) => match.metadata!.text)
      .join("\n")
      .substring(0, 3000);

    const prompt = {
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${doc}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `,
    } as const;

    let isFirst = true;
    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages: [prompt, ...passedMessages],
      onFinish: () => {},
      onChunk: () => {
        if (isFirst) {
          isFirst = false;
        }
      },
    });

    result.pipeTextStreamToResponse(res);
  } catch (e) {
    throw next(e);
  }
}
