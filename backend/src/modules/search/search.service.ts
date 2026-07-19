import { GoogleGenerativeAI } from "@google/generative-ai";
import { Types } from "mongoose";
import { env } from "../../config/env";
import { ConversationModel } from "../conversations/conversations.model";
import { DocumentChunkModel } from "../documents/document-chunk.model";
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
    matchType?: "keyword" | "semantic";
  }>;
  conversations: Array<{
    id: string;
    documentId?: string;
    question: string;
    answer: string;
    createdAt: Date;
  }>;
}

const geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < a.length; index += 1) {
    const valueA = a[index] ?? 0;
    const valueB = b[index] ?? 0;
    dot += valueA * valueB;
    magA += valueA * valueA;
    magB += valueB * valueB;
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function tryGenerateEmbedding(text: string): Promise<number[] | null> {
  if (!env.ENABLE_SEMANTIC_SEARCH) {
    return null;
  }

  try {
    const model = geminiClient.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
    const embeddingResponse = await model.embedContent(text);
    return embeddingResponse.embedding.values ?? null;
  } catch {
    return null;
  }
}

async function searchSemanticDocuments(
  ownerObjectId: Types.ObjectId,
  queryEmbedding: number[],
  limit: number,
): Promise<string[]> {
  const chunks = await DocumentChunkModel.find({
    ownerId: ownerObjectId,
    embedding: { $exists: true },
  })
    .sort({ createdAt: -1 })
    .limit(env.SEMANTIC_FALLBACK_SCAN_LIMIT)
    .select("documentId embedding")
    .lean<Array<{ documentId: Types.ObjectId; embedding?: number[] }>>();

  const topByDocument = new Map<string, number>();

  for (const chunk of chunks) {
    if (!chunk.embedding || chunk.embedding.length === 0) {
      continue;
    }

    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    if (score <= 0) {
      continue;
    }

    const documentId = chunk.documentId.toString();
    const currentScore = topByDocument.get(documentId) ?? -1;
    if (score > currentScore) {
      topByDocument.set(documentId, score);
    }
  }

  return [...topByDocument.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([documentId]) => documentId);
}

export async function searchByOwner(ownerId: string, query: SearchQuery): Promise<SearchResult> {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const [keywordDocuments, conversations, queryEmbedding] = await Promise.all([
    DocumentModel.find(
      {
        ownerId: ownerObjectId,
        $text: { $search: query.q },
      },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(query.documentLimit)
      .select("_id title originalFilename status uploadDate mimeType sizeInBytes")
      .lean<
        Array<{
          _id: Types.ObjectId;
          title?: string;
          originalFilename: string;
          status: "uploaded" | "processing" | "ready" | "failed";
          uploadDate: Date;
          mimeType: string;
          sizeInBytes: number;
        }>
      >(),
    ConversationModel.find(
      {
        ownerId: ownerObjectId,
        $text: { $search: query.q },
      },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(query.conversationLimit)
      .select("_id documentId question answer createdAt")
      .lean<
        Array<{
          _id: Types.ObjectId;
          documentId?: Types.ObjectId;
          question: string;
          answer: string;
          createdAt: Date;
        }>
      >(),
    tryGenerateEmbedding(query.q),
  ]);

  const documentEntries: SearchResult["documents"] = keywordDocuments.map((document) => ({
    id: document._id.toString(),
    ...(document.title ? { title: document.title } : {}),
    originalFilename: document.originalFilename,
    status: document.status,
    uploadDate: document.uploadDate,
    mimeType: document.mimeType,
    sizeInBytes: document.sizeInBytes,
    matchType: "keyword" as const,
  }));

  if (queryEmbedding && queryEmbedding.length > 0) {
    const semanticDocumentIds = await searchSemanticDocuments(
      ownerObjectId,
      queryEmbedding,
      query.documentLimit,
    );
    const existingDocumentIds = new Set(documentEntries.map((document) => document.id));
    const remainingIds = semanticDocumentIds.filter((documentId) => !existingDocumentIds.has(documentId));

    if (remainingIds.length > 0) {
      const semanticDocs = await DocumentModel.find({
        _id: { $in: remainingIds.map((id) => new Types.ObjectId(id)) },
        ownerId: ownerObjectId,
      })
        .limit(query.documentLimit)
        .select("_id title originalFilename status uploadDate mimeType sizeInBytes")
        .lean<
          Array<{
            _id: Types.ObjectId;
            title?: string;
            originalFilename: string;
            status: "uploaded" | "processing" | "ready" | "failed";
            uploadDate: Date;
            mimeType: string;
            sizeInBytes: number;
          }>
        >();

      const byId = new Map(semanticDocs.map((doc) => [doc._id.toString(), doc]));
      for (const documentId of remainingIds) {
        const document = byId.get(documentId);
        if (!document) {
          continue;
        }
        documentEntries.push({
          id: document._id.toString(),
          ...(document.title ? { title: document.title } : {}),
          originalFilename: document.originalFilename,
          status: document.status,
          uploadDate: document.uploadDate,
          mimeType: document.mimeType,
          sizeInBytes: document.sizeInBytes,
          matchType: "semantic",
        });
        if (documentEntries.length >= query.documentLimit) {
          break;
        }
      }
    }
  }

  return {
    documents: documentEntries.slice(0, query.documentLimit),
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
