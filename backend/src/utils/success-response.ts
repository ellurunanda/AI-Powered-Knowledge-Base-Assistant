import type { Response } from "express";

interface SuccessResponseOptions<T> {
  res: Response;
  data?: T;
  message?: string;
  statusCode?: number;
  extra?: Record<string, unknown>;
}

export function sendSuccess<T>({
  res,
  data,
  message,
  statusCode = 200,
  extra,
}: SuccessResponseOptions<T>): void {
  const payload: Record<string, unknown> = {
    success: true,
  };

  if (message) {
    payload.message = message;
  }

  if (data !== undefined) {
    payload.data = data;
  }

  if (extra) {
    Object.assign(payload, extra);
  }

  res.status(statusCode).json(payload);
}

