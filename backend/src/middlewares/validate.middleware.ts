import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const payload = {
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    };

    const result = schema.safeParse(payload);

    if (!result.success) {
      next(result.error);
      return;
    }

    const parsed = result.data as {
      body: Request["body"];
      params: Request["params"];
      query: Request["query"];
    };

    req.body = parsed.body;
    req.params = parsed.params;
    req.query = parsed.query;
    next();
  };
}
