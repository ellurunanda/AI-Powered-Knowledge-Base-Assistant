import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleDocument } from "../../services/files/upload.middleware";
import {
  deleteDocumentController,
  listDocumentsController,
  previewDocumentController,
  uploadDocumentController,
} from "./documents.controller";

const documentsRouter = Router();

documentsRouter.post("/upload", authMiddleware, uploadSingleDocument, uploadDocumentController);
documentsRouter.get("/", authMiddleware, listDocumentsController);
documentsRouter.get("/:documentId/preview", authMiddleware, previewDocumentController);
documentsRouter.delete("/:documentId", authMiddleware, deleteDocumentController);

export { documentsRouter };
