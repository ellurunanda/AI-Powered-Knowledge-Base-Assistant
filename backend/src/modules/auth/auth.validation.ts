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
    role: z.enum(["member", "admin"]),
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

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(["member", "admin"]),
  }),
  params: z.object({
    userId: z.string().trim().min(1),
  }),
  query: z.object({}),
});

export const updateUserApprovalSchema = z.object({
  body: z.object({
    isApproved: z.boolean(),
  }),
  params: z.object({
    userId: z.string().trim().min(1),
  }),
  query: z.object({}),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserApprovalInput = z.infer<typeof updateUserApprovalSchema>;
