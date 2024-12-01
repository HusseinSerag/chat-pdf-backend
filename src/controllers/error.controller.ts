import { NextFunction, Request, Response } from "express";
import { CustomError } from "../utils/CustomError";
import log from "../utils/logger";

export function errorController(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  log.error(err.message);
  if (err instanceof CustomError) {
    res.status(err.code).json({
      status: "failure",
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "failure",
      message: "Something went wrong!",
    });
  }
}
