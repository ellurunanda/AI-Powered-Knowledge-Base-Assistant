import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(60),
  JWT_COOKIE_NAME: z.string().default("accessToken"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  CHUNK_SIZE_CHARS: z.coerce.number().int().positive().default(1200),
  CHUNK_OVERLAP_CHARS: z.coerce.number().int().min(0).default(200),
  MAX_CONTEXT_CHUNKS: z.coerce.number().int().positive().default(6),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(200),
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;
