import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { askQuestionController } from "./chat.controller";
import { askQuestionSchema } from "./chat.validation";

const chatRouter = Router();

chatRouter.post("/ask", authMiddleware, validate(askQuestionSchema), askQuestionController);

export { chatRouter };

