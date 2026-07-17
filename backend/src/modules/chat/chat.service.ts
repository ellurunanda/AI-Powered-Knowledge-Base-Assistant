import { GoogleGenerativeAI } from "@google/generative-ai";
import { Types } from "mongoose";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import { ConversationModel } from "../conversations/conversations.model";
import { DocumentChunkModel } from "../documents/document-chunk.model";
import { getDocumentByIdForOwner, updateDocumentStatus } from "../documents/documents.service";
import { extractTextFromDocument } from "../../services/files/document-parser.service";
import { chunkText, estimateTokensFromText } from "../../services/files/text-chunker";
import type { AskQuestionInput } from "./chat.validation";

const geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);

interface ChatResponse {
  answer: string;
  documentId: string;
  sourceChunkIds: string[];
}

async function ensureChunksForDocument(documentId: Types.ObjectId, ownerId: Types.ObjectId): Promise<void> {
  const existingChunkCount = await DocumentChunkModel.countDocuments({ documentId, ownerId });
  if (existingChunkCount > 0) {
    return;
  }

  const document = await getDocumentByIdForOwner(documentId.toString(), ownerId.toString());
  if (!document) {
    throw new AppError("Document not found", 404);
  }

  await updateDocumentStatus(documentId, "processing");
  try {
    const extractedText = await extractTextFromDocument(document.storagePath, document.mimeType);
    const chunks = chunkText(extractedText, env.CHUNK_SIZE_CHARS, env.CHUNK_OVERLAP_CHARS);

    if (chunks.length === 0) {
      throw new AppError("No text chunks could be generated from this document", 422);
    }

    await DocumentChunkModel.insertMany(
      chunks.map((chunk) => ({
        documentId,
        ownerId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCountEstimate: chunk.tokenCountEstimate,
        charStart: chunk.charStart,
        charEnd: chunk.charEnd,
      })),
    );

    await updateDocumentStatus(documentId, "ready");
  } catch (error) {
    await updateDocumentStatus(documentId, "failed");
    throw error;
  }
}

async function findRelevantChunks(documentId: Types.ObjectId, ownerId: Types.ObjectId, question: string) {
  const topChunks = await DocumentChunkModel.aggregate<{
    _id: Types.ObjectId;
    content: string;
    chunkIndex: number;
  }>([
    {
      $match: {
        documentId,
        ownerId,
      },
    },
    {
      $match: {
        $text: { $search: question },
      },
    },
    {
      $addFields: {
        score: { $meta: "textScore" },
      },
    },
    {
      $sort: { score: -1 },
    },
    {
      $limit: env.MAX_CONTEXT_CHUNKS,
    },
    {
      $project: {
        _id: 1,
        content: 1,
        chunkIndex: 1,
      },
    },
  ]);

  if (topChunks.length > 0) {
    return topChunks;
  }

  return DocumentChunkModel.find({ documentId, ownerId })
    .sort({ chunkIndex: 1 })
    .limit(env.MAX_CONTEXT_CHUNKS)
    .select("_id content chunkIndex")
    .lean<{
      _id: Types.ObjectId;
      content: string;
      chunkIndex: number;
    }[]>();
}

function buildPrompt(question: string, contextChunks: Array<{ content: string; chunkIndex: number }>): string {
  const context = contextChunks
    .map((chunk) => `Chunk ${chunk.chunkIndex}:\n${chunk.content}`)
    .join("\n\n---\n\n");

  return [
    "You are an AI assistant answering questions from provided document context.",
    "Rules:",
    "1) Use only the context below.",
    "2) If context is insufficient, clearly say what is missing.",
    "3) Keep the answer concise and factual.",
    "",
    "Context:",
    context,
    "",
    `Question: ${question}`,
    "",
    "Answer:",
  ].join("\n");
}

export async function askQuestion(ownerId: string, input: AskQuestionInput): Promise<ChatResponse> {
  if (!Types.ObjectId.isValid(input.documentId)) {
    throw new AppError("Invalid document id", 400);
  }

  const ownerObjectId = new Types.ObjectId(ownerId);
  const documentObjectId = new Types.ObjectId(input.documentId);
  const document = await getDocumentByIdForOwner(input.documentId, ownerId);
  if (!document) {
    throw new AppError("Document not found", 404);
  }

  await ensureChunksForDocument(documentObjectId, ownerObjectId);
  const chunks = await findRelevantChunks(documentObjectId, ownerObjectId, input.question);

  if (chunks.length === 0) {
    throw new AppError("No document chunks available for answering", 422);
  }

  const prompt = buildPrompt(input.question, chunks);
  const startTime = Date.now();

  let answer = "";
  try {
    const model = geminiClient.getGenerativeModel({ model: env.GEMINI_MODEL });
    const response = await model.generateContent(prompt);
    answer = response.response.text().trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(`Gemini request failed: ${error.message}`, 502);
    }
    throw new AppError("Gemini request failed", 502);
  }

  if (!answer) {
    throw new AppError("Gemini returned an empty response", 502);
  }

  const inputTokensEstimate = estimateTokensFromText(prompt);
  const outputTokensEstimate = estimateTokensFromText(answer);

  await ConversationModel.create({
    ownerId: ownerObjectId,
    documentId: documentObjectId,
    question: input.question,
    answer,
    sourceChunkIds: chunks.map((chunk) => chunk._id),
    model: env.GEMINI_MODEL,
    latencyMs: Date.now() - startTime,
    inputTokensEstimate,
    outputTokensEstimate,
  });

  return {
    answer,
    documentId: document._id.toString(),
    sourceChunkIds: chunks.map((chunk) => chunk._id.toString()),
  };
}

