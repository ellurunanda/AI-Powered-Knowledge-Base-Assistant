import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/require-role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { authRateLimiter } from "../../config/security";
import {
  listUsersController,
  loginController,
  logoutController,
  meController,
  registerController,
  updateUserApprovalController,
  updateUserRoleController,
} from "./auth.controller";
import {
  loginSchema,
  registerSchema,
  updateUserApprovalSchema,
  updateUserRoleSchema,
} from "./auth.validation";

const authRouter = Router();

authRouter.post("/register", authRateLimiter, validate(registerSchema), registerController);
authRouter.post("/login", authRateLimiter, validate(loginSchema), loginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", authMiddleware, meController);
authRouter.get("/users", authMiddleware, requireRole("admin"), listUsersController);
authRouter.patch(
  "/users/:userId/role",
  authMiddleware,
  requireRole("admin"),
  validate(updateUserRoleSchema),
  updateUserRoleController,
);
authRouter.patch(
  "/users/:userId/approval",
  authMiddleware,
  requireRole("admin"),
  validate(updateUserApprovalSchema),
  updateUserApprovalController,
);

export { authRouter };
