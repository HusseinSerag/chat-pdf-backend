import {
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { chatTable } from "./chat.schema";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role_enum", ["user", "system"]);

export const messages = pgTable("messages-table", {
  id: serial("id").primaryKey(),
  chatId: serial("chat_id").notNull(),
  content: varchar("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: roleEnum("role").notNull(),
});

export const messagesRelation = relations(messages, ({ one }) => ({
  chat: one(chatTable, {
    fields: [messages.chatId],
    references: [chatTable.id],
  }),
}));
