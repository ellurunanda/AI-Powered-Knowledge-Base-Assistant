import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  loginController,
  logoutController,
  meController,
  registerController,
} from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), registerController);
authRouter.post("/login", validate(loginSchema), loginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", authMiddleware, meController);

export { authRouter };

