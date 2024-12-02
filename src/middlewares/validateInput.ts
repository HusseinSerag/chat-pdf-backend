import { ZodSchema } from "zod";
import { NextFunction, Request, Response } from "express";
import { CustomError } from "../utils/CustomError";
import { IRequest } from "../utils/types";

export function validate(schema: ZodSchema) {
  return function (req: IRequest, res: Response, next: NextFunction) {
    try {
      
      const val = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      if (!val.success) {
        let errors = "";
        const flattened = val.error.flatten();
        for (const val of Object.keys(flattened.fieldErrors)) {
          errors += flattened.fieldErrors[val]?.flat();
        }
        throw new CustomError(errors, 401);
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
