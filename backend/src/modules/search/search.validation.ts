import { z } from "zod";

export const searchSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    q: z.string().trim().min(1).max(200),
    documentLimit: z.coerce.number().int().min(1).max(50).default(20),
    conversationLimit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export type SearchQuery = z.infer<typeof searchSchema>["query"];

