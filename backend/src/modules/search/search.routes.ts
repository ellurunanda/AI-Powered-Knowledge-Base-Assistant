import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { searchController } from "./search.controller";
import { searchSchema } from "./search.validation";

const searchRouter = Router();

searchRouter.get("/", authMiddleware, validate(searchSchema), searchController);

export { searchRouter };

