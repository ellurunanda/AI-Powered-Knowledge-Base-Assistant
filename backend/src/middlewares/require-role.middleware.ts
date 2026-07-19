import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error";
import { requireUser } from "../utils/request-user";

type UserRole = "member" | "admin";

export function requireRole(requiredRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = requireUser(req);

    if (user.role !== requiredRole) {
      next(new AppError("You do not have permission to access this resource", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
}

