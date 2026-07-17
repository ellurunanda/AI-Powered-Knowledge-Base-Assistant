import { z } from "zod";

export const listConversationsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    documentId: z.string().trim().optional(),
  }),
});

export const getConversationByIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    conversationId: z.string().trim().min(1),
  }),
  query: z.object({}),
});

export type ListConversationsQuery = z.infer<typeof listConversationsSchema>["query"];
export type GetConversationByIdParams = z.infer<typeof getConversationByIdSchema>["params"];

