import { Request, type Express, NextFunction, Response } from "express";
import chatRoute from "./src/routes/PDF.route";
import { errorController as errorHandler } from "./src/controllers/error.controller";

export function setupRoutes(app: Express) {
  app.use("/api/chats", chatRoute);

  app.use(errorHandler);
}
