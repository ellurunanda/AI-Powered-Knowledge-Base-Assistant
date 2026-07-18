import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions, generalRateLimiter } from "./config/security";
import { env } from "./config/env";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware";
import { requestSanitizerMiddleware } from "./middlewares/request-sanitizer.middleware";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { chatRouter } from "./modules/chat/chat.routes";
import { conversationsRouter } from "./modules/conversations/conversations.routes";
import { documentsRouter } from "./modules/documents/documents.routes";
import { searchRouter } from "./modules/search/search.routes";

export const app = express();

app.set("trust proxy", env.TRUST_PROXY);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));
app.use("/api", generalRateLimiter);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(cookieParser());
app.use(requestSanitizerMiddleware);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/search", searchRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
