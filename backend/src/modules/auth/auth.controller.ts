import type { Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import { getProfile, loginUser, registerUser } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.validation";

const cookieMaxAgeMs = env.JWT_EXPIRES_IN_MINUTES * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: cookieMaxAgeMs,
  });
}

export const registerController = asyncHandler(
  async (req: Request<object, object, RegisterInput>, res: Response) => {
    const payload = req.body;
    const result = await registerUser(payload);

    setAuthCookie(res, result.token);
    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: result,
    });
  },
);

export const loginController = asyncHandler(
  async (req: Request<object, object, LoginInput>, res: Response) => {
    const payload = req.body;
    const result = await loginUser(payload);

    setAuthCookie(res, result.token);
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: result,
    });
  },
);

export const meController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const profile = await getProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: profile,
  });
});

export const logoutController = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.JWT_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
