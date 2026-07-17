import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { getConversationController, listConversationsController } from "./conversations.controller";
import { getConversationByIdSchema, listConversationsSchema } from "./conversations.validation";

const conversationsRouter = Router();

conversationsRouter.get("/", authMiddleware, validate(listConversationsSchema), listConversationsController);
conversationsRouter.get(
  "/:conversationId",
  authMiddleware,
  validate(getConversationByIdSchema),
  getConversationController,
);

export { conversationsRouter };

