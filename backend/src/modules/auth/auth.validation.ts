import { z } from "zod";

const email = z.string().trim().email().max(255);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email,
    password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
