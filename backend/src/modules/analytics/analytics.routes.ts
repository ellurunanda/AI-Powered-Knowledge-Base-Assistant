import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { getDashboardAnalyticsController } from "./analytics.controller";
import { getDashboardAnalyticsSchema } from "./analytics.validation";

const analyticsRouter = Router();

analyticsRouter.get(
  "/dashboard",
  authMiddleware,
  validate(getDashboardAnalyticsSchema),
  getDashboardAnalyticsController,
);

export { analyticsRouter };

