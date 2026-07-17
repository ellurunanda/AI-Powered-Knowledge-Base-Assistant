import { AppError } from "./app-error";

interface RequestWithUser {
  user?: {
    id: string;
    email: string;
  };
}

export function requireUser(req: RequestWithUser): { id: string; email: string } {
  if (!req.user) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return req.user;
}
