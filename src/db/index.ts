import { neon } from "@neondatabase/serverless";

import { drizzle } from "drizzle-orm/neon-http";
import * as schemaChats from "../schema/chat.schema";
import * as schemaMessages from "../schema/messages.schema";
const databaseURL = process.env.DATABASE_URL;
if (!databaseURL) {
  throw new Error("Database url doesn't exist");
}
const sql = neon(databaseURL);

export const db = drizzle({
  client: sql,
  schema: {
    ...schemaChats,
    ...schemaMessages,
  },
});
