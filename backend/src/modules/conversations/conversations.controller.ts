import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import { getConversationById, listConversationsByOwner } from "./conversations.service";
import {
  getConversationByIdSchema,
  listConversationsSchema,
} from "./conversations.validation";

export const listConversationsController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const parsed = listConversationsSchema.safeParse({
    body: {},
    params: {},
    query: req.query,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  const result = await listConversationsByOwner(req.user.id, parsed.data.query);
  res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
});

export const getConversationController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const parsed = getConversationByIdSchema.safeParse({
      body: {},
      params: req.params,
      query: {},
    });

    if (!parsed.success) {
      throw parsed.error;
    }

    const result = await getConversationById(req.user.id, parsed.data.params.conversationId);
    res.status(200).json({
      success: true,
      data: result,
    });
  },
);
