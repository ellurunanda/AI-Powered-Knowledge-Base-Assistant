import { z } from "zod";

export const getDashboardAnalyticsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    recentLimit: z.coerce.number().int().min(1).max(20).default(5),
  }),
});

export type DashboardAnalyticsQuery = z.infer<typeof getDashboardAnalyticsSchema>["query"];

