import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { UserModel } from "./auth.model";
import type { LoginInput, RegisterInput } from "./auth.validation";

interface AuthResult {
  token?: string;
  requiresApproval: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: "member" | "admin";
    isApproved: boolean;
  };
}

interface TokenPayload {
  sub: string;
  email: string;
  role: "member" | "admin";
}

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN_MINUTES * 60,
  });
}

function mapUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: "member" | "admin";
  isApproved: boolean;
}): AuthResult["user"] {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved,
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
    role: input.role,
    isApproved: input.role === "admin",
  });

  const requiresApproval = user.role === "member" && !user.isApproved;
  const token = requiresApproval
    ? undefined
    : signToken({
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      });

  const result: AuthResult = {
    requiresApproval,
    user: mapUser(user),
  };

  if (token) {
    result.token = token;
  }

  return result;
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

  if (user.role === "member" && !user.isApproved) {
    throw new AppError(
      "Your account is pending admin approval. Please wait until an admin approves your access.",
      403,
      "ACCOUNT_PENDING_APPROVAL",
    );
  }

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    token,
    requiresApproval: false,
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
    role: user.role,
    isApproved: user.isApproved,
  });
}

export async function listAllUsers() {
  const users = await UserModel.find({})
    .sort({ createdAt: -1 })
    .select("_id name email role isApproved createdAt")
    .lean<
      Array<{
        _id: { toString(): string };
        name: string;
        email: string;
        role: "member" | "admin";
        isApproved: boolean;
        createdAt: Date;
      }>
    >();

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved,
    createdAt: user.createdAt,
  }));
}

export async function updateUserRole(userId: string, role: "member" | "admin") {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await UserModel.findByIdAndUpdate(
    new Types.ObjectId(userId),
    { $set: { role } },
    { new: true },
  )
    .select("_id name email role isApproved")
    .lean<
      { _id: { toString(): string }; name: string; email: string; role: "member" | "admin"; isApproved: boolean } | null
    >();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return mapUser(user);
}

export async function updateUserApproval(userId: string, isApproved: boolean) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await UserModel.findById(new Types.ObjectId(userId));
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "member") {
    throw new AppError("Approval flow applies to member accounts only", 400);
  }

  user.isApproved = isApproved;
  await user.save();

  return mapUser({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isApproved: user.isApproved,
  });
}
