import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error";

const blockedKeys = new Set(["__proto__", "constructor", "prototype"]);

function inspectValue(value: unknown, path: string[]): void {
  if (typeof value === "string" && value.includes("\0")) {
    throw new AppError("Invalid input payload", 400, "INVALID_INPUT", {
      path: path.join("."),
      reason: "Null byte detected",
    });
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      inspectValue(item, [...path, String(index)]);
    });
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".") || blockedKeys.has(key)) {
      throw new AppError("Unsafe input payload", 400, "UNSAFE_INPUT", {
        path: [...path, key].join("."),
      });
    }

    inspectValue(nestedValue, [...path, key]);
  }
}

export function requestSanitizerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    inspectValue(req.body, ["body"]);
    inspectValue(req.params, ["params"]);
    inspectValue(req.query, ["query"]);
    next();
  } catch (error) {
    next(error);
  }
}
