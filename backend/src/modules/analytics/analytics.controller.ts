import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { requireUser } from "../../utils/request-user";
import { sendSuccess } from "../../utils/success-response";
import { getDashboardAnalytics } from "./analytics.service";
import type { DashboardAnalyticsQuery } from "./analytics.validation";

export const getDashboardAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const query = req.query as unknown as DashboardAnalyticsQuery;

  const result = await getDashboardAnalytics(user.id, query);
  sendSuccess({
    res,
    data: result,
  });
});
