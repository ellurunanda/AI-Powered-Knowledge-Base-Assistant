import cors, { type CorsOptions } from "cors";
import { rateLimit } from "express-rate-limit";
import { env } from "./env";
import { AppError } from "../utils/app-error";

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError("CORS origin is not allowed", 403, "CORS_ORIGIN_DENIED", {
        origin,
      }),
    );
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

function createRateLimiter(maxRequests: number, message: string) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({
        success: false,
        message,
        code: "RATE_LIMITED",
      });
    },
  });
}

export const generalRateLimiter = createRateLimiter(
  env.RATE_LIMIT_MAX_REQUESTS,
  "Too many requests. Please try again later.",
);

export const authRateLimiter = createRateLimiter(
  env.AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  "Too many authentication attempts. Please wait and try again.",
);
