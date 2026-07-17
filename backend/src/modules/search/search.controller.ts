import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import { searchByOwner } from "./search.service";
import { searchSchema } from "./search.validation";

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const parsed = searchSchema.safeParse({
    body: {},
    params: {},
    query: req.query,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  const result = await searchByOwner(req.user.id, parsed.data.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

