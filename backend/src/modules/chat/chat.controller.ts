import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { requireUser } from "../../utils/request-user";
import { sendSuccess } from "../../utils/success-response";
import { askQuestion, askQuestionStream } from "./chat.service";
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

export const askQuestionStreamController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = req.body as AskQuestionInput;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const writeEvent = (payload: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const result = await askQuestionStream(user.id, input, async (token) => {
      writeEvent({ type: "token", token });
    });

    writeEvent({
      type: "done",
      answer: result.answer,
      documentId: result.documentId,
      sourceChunkIds: result.sourceChunkIds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to stream answer";
    writeEvent({ type: "error", message });
  } finally {
    res.end();
  }
});
