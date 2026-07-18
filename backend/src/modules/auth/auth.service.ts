import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { UserModel } from "./auth.model";
import type { LoginInput, RegisterInput } from "./auth.validation";

interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TokenPayload {
  sub: string;
  email: string;
}

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN_MINUTES * 60,
  });
}

function mapUser(user: { _id: { toString(): string }; name: string; email: string }): AuthResult["user"] {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const normalizedEmail = input.email.toLowerCase();
  const existingUser = await UserModel.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({
    name: input.name,
    email: normalizedEmail,
    passwordHash,
  });

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
  });

  return {
    token,
    user: mapUser(user),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const normalizedEmail = input.email.toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
  });

  return {
    token,
    user: mapUser(user),
  };
}

export async function getProfile(userId: string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return mapUser({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
  });
}
