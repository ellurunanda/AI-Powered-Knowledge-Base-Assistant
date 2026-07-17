import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { requireUser } from "../../utils/request-user";
import { sendSuccess } from "../../utils/success-response";
import { askQuestion } from "./chat.service";
import type { AskQuestionInput } from "./chat.validation";

export const askQuestionController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = requireUser(req);
    const result = await askQuestion(user.id, req.body as AskQuestionInput);
    sendSuccess({
      res,
      data: result,
    });
  },
);
