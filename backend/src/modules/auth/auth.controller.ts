import type { Request, Response } from "express";
import { env } from "../../config/env";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import { requireUser } from "../../utils/request-user";
import { sendSuccess } from "../../utils/success-response";
import {
  getProfile,
  listAllUsers,
  loginUser,
  registerUser,
  updateUserApproval,
  updateUserRole,
} from "./auth.service";
import type {
  LoginInput,
  RegisterInput,
  UpdateUserApprovalInput,
  UpdateUserRoleInput,
} from "./auth.validation";

const cookieMaxAgeMs = env.JWT_EXPIRES_IN_MINUTES * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge: cookieMaxAgeMs,
  });
}

export const registerController = asyncHandler(
  async (req: Request<object, object, RegisterInput>, res: Response) => {
    const payload = req.body;
    const result = await registerUser(payload);

    if (result.token) {
      setAuthCookie(res, result.token);
    }
    sendSuccess({
      res,
      statusCode: 201,
      message: result.requiresApproval
        ? "Registered successfully. Your account is pending admin approval."
        : "Registered successfully",
      data: result,
    });
  },
);

export const loginController = asyncHandler(
  async (req: Request<object, object, LoginInput>, res: Response) => {
    const payload = req.body;
    const result = await loginUser(payload);

    if (!result.token) {
      throw new AppError("Missing auth token for approved login", 500);
    }

    setAuthCookie(res, result.token);
    sendSuccess({
      res,
      message: "Logged in successfully",
      data: result,
    });
  },
);

export const meController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const profile = await getProfile(user.id);
  sendSuccess({
    res,
    data: profile,
  });
});

export const logoutController = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.JWT_COOKIE_NAME, {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
  });

  sendSuccess({
    res,
    message: "Logged out successfully",
  });
});

export const listUsersController = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listAllUsers();
  sendSuccess({
    res,
    data: users,
  });
});

export const updateUserRoleController = asyncHandler(async (req: Request, res: Response) => {
  const payload = req as Request<
    { userId: string },
    unknown,
    UpdateUserRoleInput["body"],
    UpdateUserRoleInput["query"]
  >;

  const updatedUser = await updateUserRole(payload.params.userId, payload.body.role);
  sendSuccess({
    res,
    message: "User role updated successfully",
    data: updatedUser,
  });
});

export const updateUserApprovalController = asyncHandler(async (req: Request, res: Response) => {
  const payload = req as Request<
    { userId: string },
    unknown,
    UpdateUserApprovalInput["body"],
    UpdateUserApprovalInput["query"]
  >;

  const updatedUser = await updateUserApproval(payload.params.userId, payload.body.isApproved);
  sendSuccess({
    res,
    message: payload.body.isApproved ? "User approved successfully" : "User approval removed",
    data: updatedUser,
  });
});
