import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import { getDashboardAnalytics } from "./analytics.service";
import { getDashboardAnalyticsSchema } from "./analytics.validation";

export const getDashboardAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const parsed = getDashboardAnalyticsSchema.safeParse({
    body: {},
    params: {},
    query: req.query,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  const result = await getDashboardAnalytics(req.user.id, parsed.data.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

