import type { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const cookieToken = req.cookies?.[env.JWT_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    next(new AppError("Authentication token is required", 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string" || !decoded.sub || !decoded.email) {
      throw new AppError("Invalid authentication token payload", 401);
    }

    const role = decoded.role === "admin" ? "admin" : "member";

    req.user = {
      id: decoded.sub,
      email: String(decoded.email),
      role,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new AppError("Authentication token has expired", 401));
      return;
    }

    if (error instanceof JsonWebTokenError) {
      next(new AppError("Invalid authentication token", 401));
      return;
    }

    next(error);
  }
}
