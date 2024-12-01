import {
  ColumnBaseConfig,
  ColumnDataType,
  and,
  asc,
  desc,
  eq,
} from "drizzle-orm";
import { db } from "../db";
import { chatTable } from "../schema/chat.schema";
import { getS3Url } from "../utils/s3";
import {
  PgColumn,
  PgTable,
  PgTableWithColumns,
  TableConfig,
} from "drizzle-orm/pg-core";
import { CustomError } from "../utils/CustomError";

export async function createChatService(
  fileKey: string,
  fileName: string,
  userId: string
) {
  try {
    console.log(userId);
    const chat = await db
      .insert(chatTable)
      .values({
        pdfName: fileName,
        pdfURL: getS3Url(fileKey),
        userId,
        fileKey,
      })
      .returning();
    return chat;
  } catch (e) {
    throw e;
  }
}
export async function getSingleChat(userId: string, chatId: number) {
  try {
    const chat = db
      .select()
      .from(chatTable)
      .where((chatTable) =>
        and(eq(chatTable.id, chatId), eq(chatTable.userId, userId))
      );
    if (!chat) {
      throw new CustomError("This chat doesn't exist ", 401);
    }
    return chat;
  } catch (e) {
    throw e;
  }
}
export async function getChatsService(
  filters: { [name: string]: any },

  pageSize: number,
  page: number,
  direction: "asc" | "desc" = "asc",
  sort: "fileKey" | "createdAt" | "pdfURL" | "pdfName" | "userId" | "id"
) {
  let eqs: any[] = [];
  page = parseInt(page.toString());
  pageSize = parseInt(pageSize.toString());
  for (const key of Object.keys(filters)) {
    eqs.push(createEq(chatTable, key, filters[key]));
  }

  const orderBy =
    direction === "desc" ? [desc(chatTable[sort])] : [chatTable[sort]];

  try {
    const chats = await db.query.chatTable.findMany({
      where: and(...eqs),
      orderBy: orderBy,
      limit: pageSize,
      offset: pageSize * page,
      columns: {
        createdAt: true,
        id: true,
        pdfName: true,
        pdfURL: true,
      },
    });
    return chats;
  } catch (e) {
    throw e;
  }
}

function createEq<T extends TableConfig>(
  table: PgTableWithColumns<T>,
  key: string,
  value: any
) {
  return eq(table[key], value);
}
