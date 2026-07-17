import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleDocument } from "../../services/files/upload.middleware";
import { listDocumentsController, uploadDocumentController } from "./documents.controller";

const documentsRouter = Router();

documentsRouter.post("/upload", authMiddleware, uploadSingleDocument, uploadDocumentController);
documentsRouter.get("/", authMiddleware, listDocumentsController);

export { documentsRouter };

