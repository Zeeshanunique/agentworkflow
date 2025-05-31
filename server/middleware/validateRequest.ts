import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Validation failed",
          errors: validationError.details
        });
      } else {
        next(error);
      }
    }
  };
}; 