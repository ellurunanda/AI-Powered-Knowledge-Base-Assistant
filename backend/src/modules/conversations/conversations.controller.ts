import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { requireUser } from "../../utils/request-user";
import { sendSuccess } from "../../utils/success-response";
import { getConversationById, listConversationsByOwner } from "./conversations.service";
import {
  type GetConversationByIdParams,
  type ListConversationsQuery,
} from "./conversations.validation";

export const listConversationsController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const query = req.query as unknown as ListConversationsQuery;

  const result = await listConversationsByOwner(user.id, query);
  sendSuccess({
    res,
    data: result.items,
    extra: {
      pagination: result.pagination,
    },
  });
});

export const getConversationController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireUser(req);
    const params = req.params as unknown as GetConversationByIdParams;

    const result = await getConversationById(user.id, params.conversationId);
    sendSuccess({
      res,
      data: result,
    });
  },
);
