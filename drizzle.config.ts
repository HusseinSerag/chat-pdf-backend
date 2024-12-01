import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";
dotenv.config({
  path: path.resolve("./src/config/.env"),
});

export default defineConfig({
  schema: "./src/schema/*",
  out: "./migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
