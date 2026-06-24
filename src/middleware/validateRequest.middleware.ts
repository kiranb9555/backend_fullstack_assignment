import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type SupportedSchema =
  | AnyZodObject
  | ZodEffects<AnyZodObject>;

export const validateRequest =
  (schema: SupportedSchema) =>
  (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    const payload =
      req.method === "GET"
        ? req.query
        : req.body;

    const parsed =
      schema.safeParse(payload);

    if (!parsed.success) {
      return next(parsed.error);
    }

    if (req.method === "GET") {
      req.query = parsed.data;
    } else {
      req.body = parsed.data;
    }

    return next();
  };