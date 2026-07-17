import { z } from "zod";

export const uploadDocumentBodySchema = z.object({
  title: z.string().trim().max(255).optional(),
});

export type UploadDocumentBody = z.infer<typeof uploadDocumentBodySchema>;

