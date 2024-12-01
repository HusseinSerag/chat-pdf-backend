import { AuthObject, User } from "@clerk/express";
import { Request } from "express";

export interface IRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any>
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  auth?: AuthObject;
  user?: User;
}
