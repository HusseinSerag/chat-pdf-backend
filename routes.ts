import { Request, type Express, NextFunction, Response } from "express";
import chatRoute from "./src/routes/PDF.route";
import { errorController as errorHandler } from "./src/controllers/error.controller";
import messageRouter from "./src/routes/messages.routes";

export function setupRoutes(app: Express) {
  app.use("/api/chats", chatRoute);
  app.use("/api/messages", messageRouter);

  app.use(errorHandler);
}
