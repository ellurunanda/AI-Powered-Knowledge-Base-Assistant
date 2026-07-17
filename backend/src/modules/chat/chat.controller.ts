import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import { askQuestion } from "./chat.service";
import type { AskQuestionInput } from "./chat.validation";

export const askQuestionController = asyncHandler(
  async (req: Request<object, object, AskQuestionInput>, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const result = await askQuestion(req.user.id, req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

