import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { MulterError } from "multer";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details,
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((fieldError) => ({
      path: fieldError.path,
      message: fieldError.message,
    }));

    res.status(400).json({
      success: false,
      message: "Database validation failed",
      code: "MONGO_VALIDATION_ERROR",
      details,
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid value for ${error.path}`,
      code: "MONGO_CAST_ERROR",
      details: {
        path: error.path,
        value: error.value,
      },
    });
    return;
  }

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "File is too large",
        code: "FILE_TOO_LARGE",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: error.message,
      code: "FILE_UPLOAD_ERROR",
    });
    return;
  }

  if (error instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: "Authentication token has expired",
      code: "JWT_EXPIRED",
    });
    return;
  }

  if (error instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: "Invalid authentication token",
      code: "JWT_INVALID",
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000 &&
    "keyValue" in error
  ) {
    res.status(409).json({
      success: false,
      message: "Duplicate resource",
      code: "MONGO_DUPLICATE_KEY",
      details: error.keyValue,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  if (error instanceof Error) {
    res.status(500).json({
      success: false,
      message: error.message,
      code: "UNHANDLED_ERROR",
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Unexpected server error",
    code: "UNKNOWN_ERROR",
  });
}
