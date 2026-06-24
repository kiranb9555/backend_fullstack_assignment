import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateRequest =
  <T>(schema: ZodSchema<T>) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {

    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.error.flatten()
      });

      return;
    }

    req.body = result.data;

    next();
  };