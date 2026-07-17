import path from "path";
import { Types } from "mongoose";
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
