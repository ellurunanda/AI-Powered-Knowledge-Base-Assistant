import { Types } from "mongoose";
import { ConversationModel } from "../conversations/conversations.model";
import { DocumentModel } from "../documents/documents.model";
import type { SearchQuery } from "./search.validation";

interface SearchResult {
  documents: Array<{
    id: string;
    title?: string;
    originalFilename: string;
    status: "uploaded" | "processing" | "ready" | "failed";
    uploadDate: Date;
    mimeType: string;
    sizeInBytes: number;
  }>;
  conversations: Array<{
    id: string;
    documentId?: string;
    question: string;
    answer: string;
    createdAt: Date;
  }>;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchByOwner(ownerId: string, query: SearchQuery): Promise<SearchResult> {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const safePattern = new RegExp(escapeRegex(query.q), "i");

  const [documents, conversations] = await Promise.all([
    DocumentModel.find({
      ownerId: ownerObjectId,
      $or: [{ title: safePattern }, { originalFilename: safePattern }],
    })
      .sort({ uploadDate: -1 })
      .limit(query.documentLimit)
      .select("_id title originalFilename status uploadDate mimeType sizeInBytes")
      .lean<{
        _id: Types.ObjectId;
        title?: string;
        originalFilename: string;
        status: "uploaded" | "processing" | "ready" | "failed";
        uploadDate: Date;
        mimeType: string;
        sizeInBytes: number;
      }[]>(),
    ConversationModel.find({
      ownerId: ownerObjectId,
      $or: [{ question: safePattern }, { answer: safePattern }],
    })
      .sort({ createdAt: -1 })
      .limit(query.conversationLimit)
      .select("_id documentId question answer createdAt")
      .lean<{
        _id: Types.ObjectId;
        documentId?: Types.ObjectId;
        question: string;
        answer: string;
        createdAt: Date;
      }[]>(),
  ]);

  return {
    documents: documents.map((document) => {
      const mapped: SearchResult["documents"][number] = {
        id: document._id.toString(),
        originalFilename: document.originalFilename,
        status: document.status,
        uploadDate: document.uploadDate,
        mimeType: document.mimeType,
        sizeInBytes: document.sizeInBytes,
      };
      if (document.title) {
        mapped.title = document.title;
      }
      return mapped;
    }),
    conversations: conversations.map((conversation) => {
      const mapped: SearchResult["conversations"][number] = {
        id: conversation._id.toString(),
        question: conversation.question,
        answer: conversation.answer,
        createdAt: conversation.createdAt,
      };
      if (conversation.documentId) {
        mapped.documentId = conversation.documentId.toString();
      }
      return mapped;
    }),
  };
}

