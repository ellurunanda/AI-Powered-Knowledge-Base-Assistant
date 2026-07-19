import path from "path";
import { unlink } from "fs/promises";
import { Types } from "mongoose";
import { AppError } from "../../utils/app-error";
import { ConversationModel } from "../conversations/conversations.model";
import { DocumentChunkModel } from "./document-chunk.model";
import { extractTextFromDocument } from "../../services/files/document-parser.service";
import { DocumentModel } from "./documents.model";

interface CreateDocumentInput {
  ownerId: string;
  file: Express.Multer.File;
  title?: string;
}

export async function createDocumentRecord(input: CreateDocumentInput) {
  const extension = path.extname(input.file.originalname).toLowerCase();
  const documentPayload: {
    ownerId: Types.ObjectId;
    originalFilename: string;
    storedFilename: string;
    mimeType: string;
    sizeInBytes: number;
    storagePath: string;
    status: "uploaded";
    metadata: { extension: string };
    title?: string;
  } = {
    ownerId: new Types.ObjectId(input.ownerId),
    originalFilename: input.file.originalname,
    storedFilename: input.file.filename,
    mimeType: input.file.mimetype,
    sizeInBytes: input.file.size,
    storagePath: input.file.path,
    status: "uploaded",
    metadata: {
      extension,
    },
  };

  if (input.title) {
    documentPayload.title = input.title.trim();
  }

  const document = await DocumentModel.create(documentPayload);

  return {
    id: document._id.toString(),
    ownerId: document.ownerId.toString(),
    originalFilename: document.originalFilename,
    storedFilename: document.storedFilename,
    mimeType: document.mimeType,
    sizeInBytes: document.sizeInBytes,
    uploadDate: document.uploadDate,
    status: document.status,
    title: document.title,
    metadata: document.metadata,
  };
}

export async function listDocumentsByOwner(ownerId: string) {
  const documents = await DocumentModel.find({ ownerId: new Types.ObjectId(ownerId) })
    .sort({ uploadDate: -1 })
    .select(
      "_id ownerId originalFilename storedFilename mimeType sizeInBytes uploadDate status metadata title",
    )
    .lean<{
      _id: Types.ObjectId;
      ownerId: Types.ObjectId;
      originalFilename: string;
      storedFilename: string;
      mimeType: string;
      sizeInBytes: number;
      uploadDate: Date;
      status: "uploaded" | "processing" | "ready" | "failed";
      title?: string;
      metadata: { extension: string };
    }[]>();

  return documents.map((doc) => ({
    id: doc._id.toString(),
    ownerId: doc.ownerId.toString(),
    originalFilename: doc.originalFilename,
    storedFilename: doc.storedFilename,
    mimeType: doc.mimeType,
    sizeInBytes: doc.sizeInBytes,
    uploadDate: doc.uploadDate,
    status: doc.status,
    title: doc.title,
    metadata: doc.metadata,
  }));
}

export async function getDocumentByIdForOwner(documentId: string, ownerId: string) {
  if (!Types.ObjectId.isValid(documentId)) {
    return null;
  }

  return DocumentModel.findOne({
    _id: new Types.ObjectId(documentId),
    ownerId: new Types.ObjectId(ownerId),
  });
}

export async function updateDocumentStatus(documentId: Types.ObjectId, status: "processing" | "ready" | "failed") {
  await DocumentModel.updateOne({ _id: documentId }, { $set: { status } });
}

export async function getDocumentPreviewById(ownerId: string, documentId: string) {
  if (!Types.ObjectId.isValid(documentId)) {
    throw new AppError("Invalid document id", 400);
  }

  const document = await DocumentModel.findOne({
    _id: new Types.ObjectId(documentId),
    ownerId: new Types.ObjectId(ownerId),
  })
    .select("_id title originalFilename mimeType storagePath")
    .lean<{
      _id: Types.ObjectId;
      title?: string;
      originalFilename: string;
      mimeType: string;
      storagePath: string;
    } | null>();

  if (!document) {
    throw new AppError("Document not found", 404);
  }

  const text = await extractTextFromDocument(document.storagePath, document.mimeType);
  const maxPreviewChars = 2500;
  const previewText = text.slice(0, maxPreviewChars);

  return {
    documentId: document._id.toString(),
    title: document.title,
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    previewText,
    isTruncated: text.length > maxPreviewChars,
    totalCharacters: text.length,
  };
}

export async function deleteDocumentById(ownerId: string, documentId: string) {
  if (!Types.ObjectId.isValid(documentId)) {
    throw new AppError("Invalid document id", 400);
  }

  const ownerObjectId = new Types.ObjectId(ownerId);
  const documentObjectId = new Types.ObjectId(documentId);

  const document = await DocumentModel.findOne({
    _id: documentObjectId,
    ownerId: ownerObjectId,
  })
    .select("_id storagePath")
    .lean<{ _id: Types.ObjectId; storagePath: string } | null>();

  if (!document) {
    throw new AppError("Document not found", 404);
  }

  try {
    await unlink(document.storagePath);
  } catch (error) {
    const unlinkError = error as NodeJS.ErrnoException;
    if (unlinkError.code !== "ENOENT") {
      throw error;
    }
  }

  const [chunkDeleteResult, conversationDeleteResult, documentDeleteResult] = await Promise.all([
    DocumentChunkModel.deleteMany({
      documentId: documentObjectId,
      ownerId: ownerObjectId,
    }),
    ConversationModel.deleteMany({
      documentId: documentObjectId,
      ownerId: ownerObjectId,
    }),
    DocumentModel.deleteOne({
      _id: documentObjectId,
      ownerId: ownerObjectId,
    }),
  ]);

  if (documentDeleteResult.deletedCount !== 1) {
    throw new AppError("Failed to delete document", 500);
  }

  return {
    deletedDocumentId: documentId,
    deletedChunksCount: chunkDeleteResult.deletedCount,
    deletedConversationsCount: conversationDeleteResult.deletedCount,
  };
}
