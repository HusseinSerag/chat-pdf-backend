import { AuthObject, clerkClient } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import { IRequest } from "../utils/types";
import { CustomError } from "../utils/CustomError";

export async function requireAuth(
  req: IRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.auth!.userId;
    if (!userId) {
      throw new CustomError("Unauthenticated!", 403);
    }
    req.user = await clerkClient.users.getUser(userId);
    next();
  } catch (e) {
    next(e);
  }
}
