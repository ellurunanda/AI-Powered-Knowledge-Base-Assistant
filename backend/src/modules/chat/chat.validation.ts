import { z } from "zod";

export const askQuestionSchema = z.object({
  body: z.object({
    question: z.string().trim().min(3).max(2000),
    documentId: z.string().trim().min(1),
  }),
  params: z.object({}),
  query: z.object({}),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>["body"];

