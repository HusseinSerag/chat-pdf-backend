import { relations } from "drizzle-orm";
import { pgTable, serial, timestamp, varchar, text } from "drizzle-orm/pg-core";
import { messages } from "./messages.schema";

export const chatTable = pgTable("chat-table", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  pdfName: varchar("pdf_name").notNull(),
  pdfURL: varchar("pdf_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  fileKey: text("file_key").notNull(),
});

export const chatRelations = relations(chatTable, ({ many }) => ({
  messages: many(messages),
}));
