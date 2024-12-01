import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import log from "./src/utils/logger";
import http from "http";
dotenv.config({
  path: path.resolve("./src/config/.env"),
});

import "./drizzle.config";
import "./src/utils/s3";
import { setupRoutes } from "./routes";
import { clerkMiddleware } from "@clerk/express";
import { Server } from "socket.io";
import { setupSocketIO } from "./src/utils/setupSocketIO";
import "./src/utils/pinecone";

const app = express();
const server = http.createServer(app);
export const io = setupSocketIO(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: process.env.ORIGIN,
  })
);
app.use(cookieParser());
app.use(clerkMiddleware());
const port = process.env.PORT || 3000;

app.get("/hc", async (req, res) => {
  res.status(200).json({
    message: "Health check correct!",
  });
});

setupRoutes(app);
server.listen(port, () => {
  log.info("Server start");
});
