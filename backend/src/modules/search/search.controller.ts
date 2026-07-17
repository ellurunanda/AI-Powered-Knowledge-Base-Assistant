import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { requireUser } from "../../utils/request-user";
import { sendSuccess } from "../../utils/success-response";
import { searchByOwner } from "./search.service";
import type { SearchQuery } from "./search.validation";

export const searchController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const query = req.query as unknown as SearchQuery;

  const result = await searchByOwner(user.id, query);
  sendSuccess({
    res,
    data: result,
  });
});
