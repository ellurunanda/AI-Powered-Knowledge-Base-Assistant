import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import { requireUser } from "../../utils/request-user";
import { sendSuccess } from "../../utils/success-response";
import {
  createDocumentRecord,
  deleteDocumentById,
  getDocumentPreviewById,
  listDocumentsByOwner,
} from "./documents.service";
import { uploadDocumentBodySchema } from "./documents.validation";

export const uploadDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);

  if (!req.file) {
    throw new AppError("File is required. Use field name 'file'", 400);
  }

  const parsedBody = uploadDocumentBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw parsedBody.error;
  }

  const createInput: {
    ownerId: string;
    file: Express.Multer.File;
    title?: string;
  } = {
    ownerId: user.id,
    file: req.file,
  };

  if (parsedBody.data.title) {
    createInput.title = parsedBody.data.title;
  }

  const document = await createDocumentRecord(createInput);

  sendSuccess({
    res,
    statusCode: 201,
    message: "Document uploaded successfully",
    data: document,
  });
});

export const listDocumentsController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const documents = await listDocumentsByOwner(user.id);
  sendSuccess({
    res,
    data: documents,
  });
});

export const previewDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const rawDocumentId = req.params.documentId;
  const documentId = Array.isArray(rawDocumentId) ? rawDocumentId[0] : rawDocumentId;

  if (!documentId) {
    throw new AppError("Document id is required", 400);
  }

  const preview = await getDocumentPreviewById(user.id, documentId);
  sendSuccess({
    res,
    data: preview,
  });
});

export const deleteDocumentController = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const rawDocumentId = req.params.documentId;
  const documentId = Array.isArray(rawDocumentId) ? rawDocumentId[0] : rawDocumentId;

  if (!documentId) {
    throw new AppError("Document id is required", 400);
  }

  const result = await deleteDocumentById(user.id, documentId);

  sendSuccess({
    res,
    message: "Document deleted successfully",
    data: result,
  });
});
