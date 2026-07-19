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

interface RankedChunk {
  _id: Types.ObjectId;
  content: string;
  chunkIndex: number;
  score: number;
}

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
    const values = embeddingResponse.embedding.values ?? [];
    return values.length > 0 ? values : null;
  } catch {
    return null;
  }
}

async function backfillMissingChunkEmbeddings(documentId: Types.ObjectId, ownerId: Types.ObjectId): Promise<void> {
  if (!env.ENABLE_SEMANTIC_SEARCH) {
    return;
  }

  const chunks = await DocumentChunkModel.find({
    documentId,
    ownerId,
  })
    .select("_id content embedding")
    .lean<Array<{ _id: Types.ObjectId; content: string; embedding?: number[] }>>();

  for (const chunk of chunks) {
    if (chunk.embedding && chunk.embedding.length > 0) {
      continue;
    }

    const embedding = await tryGenerateEmbedding(chunk.content);
    if (!embedding) {
      continue;
    }

    await DocumentChunkModel.updateOne({ _id: chunk._id }, { $set: { embedding } });
  }
}

async function ensureChunksForDocument(documentId: Types.ObjectId, ownerId: Types.ObjectId): Promise<void> {
  const existingChunkCount = await DocumentChunkModel.countDocuments({ documentId, ownerId });
  if (existingChunkCount > 0) {
    await backfillMissingChunkEmbeddings(documentId, ownerId);
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

    const insertPayload: Array<{
      documentId: Types.ObjectId;
      ownerId: Types.ObjectId;
      chunkIndex: number;
      content: string;
      tokenCountEstimate: number;
      charStart: number;
      charEnd: number;
      embedding?: number[];
    }> = [];

    for (const chunk of chunks) {
      const embedding = await tryGenerateEmbedding(chunk.content);
      insertPayload.push({
        documentId,
        ownerId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCountEstimate: chunk.tokenCountEstimate,
        charStart: chunk.charStart,
        charEnd: chunk.charEnd,
        ...(embedding ? { embedding } : {}),
      });
    }

    await DocumentChunkModel.insertMany(insertPayload);
    await updateDocumentStatus(documentId, "ready");
  } catch (error) {
    await updateDocumentStatus(documentId, "failed");
    throw error;
  }
}

async function findKeywordChunks(documentId: Types.ObjectId, ownerId: Types.ObjectId, question: string) {
  const chunks = await DocumentChunkModel.find(
    {
      documentId,
      ownerId,
      $text: { $search: question },
    },
    {
      _id: 1,
      content: 1,
      chunkIndex: 1,
      score: { $meta: "textScore" },
    },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(env.MAX_CONTEXT_CHUNKS)
    .lean<Array<{ _id: Types.ObjectId; content: string; chunkIndex: number; score?: number }>>();

  return chunks.map<RankedChunk>((chunk) => ({
    _id: chunk._id,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    score: chunk.score ?? 0,
  }));
}

async function findSemanticChunksLocal(
  documentId: Types.ObjectId,
  ownerId: Types.ObjectId,
  questionEmbedding: number[],
): Promise<RankedChunk[]> {
  const chunks = await DocumentChunkModel.find({
    documentId,
    ownerId,
    embedding: { $exists: true },
  })
    .sort({ chunkIndex: 1 })
    .limit(env.SEMANTIC_FALLBACK_SCAN_LIMIT)
    .select("_id content chunkIndex embedding")
    .lean<Array<{ _id: Types.ObjectId; content: string; chunkIndex: number; embedding?: number[] }>>();

  return chunks
    .map((chunk) => ({
      _id: chunk._id,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      score: chunk.embedding ? cosineSimilarity(questionEmbedding, chunk.embedding) : 0,
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, env.MAX_CONTEXT_CHUNKS);
}

async function findSemanticChunksAtlas(
  documentId: Types.ObjectId,
  ownerId: Types.ObjectId,
  questionEmbedding: number[],
): Promise<RankedChunk[]> {
  const chunks = await DocumentChunkModel.aggregate<{
    _id: Types.ObjectId;
    content: string;
    chunkIndex: number;
    score: number;
  }>([
    {
      $vectorSearch: {
        index: env.ATLAS_VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: questionEmbedding,
        numCandidates: env.SEMANTIC_NUM_CANDIDATES,
        limit: env.MAX_CONTEXT_CHUNKS,
        filter: {
          ownerId,
          documentId,
        },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        chunkIndex: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return chunks.map((chunk) => ({
    _id: chunk._id,
    content: chunk.content,
    chunkIndex: chunk.chunkIndex,
    score: chunk.score,
  }));
}

async function findSemanticChunks(documentId: Types.ObjectId, ownerId: Types.ObjectId, question: string) {
  if (!env.ENABLE_SEMANTIC_SEARCH) {
    return [];
  }

  const questionEmbedding = await tryGenerateEmbedding(question);
  if (!questionEmbedding) {
    return [];
  }

  if (env.SEMANTIC_SEARCH_MODE === "atlas_vector") {
    try {
      const atlasChunks = await findSemanticChunksAtlas(documentId, ownerId, questionEmbedding);
      if (atlasChunks.length > 0) {
        return atlasChunks;
      }
    } catch {
      return findSemanticChunksLocal(documentId, ownerId, questionEmbedding);
    }
  }

  return findSemanticChunksLocal(documentId, ownerId, questionEmbedding);
}

async function findRelevantChunks(documentId: Types.ObjectId, ownerId: Types.ObjectId, question: string) {
  const [semanticChunks, keywordChunks] = await Promise.all([
    findSemanticChunks(documentId, ownerId, question),
    findKeywordChunks(documentId, ownerId, question),
  ]);

  const merged: RankedChunk[] = [];
  const seenIds = new Set<string>();

  for (const chunk of [...semanticChunks, ...keywordChunks]) {
    const id = chunk._id.toString();
    if (seenIds.has(id)) {
      continue;
    }
    merged.push(chunk);
    seenIds.add(id);
    if (merged.length >= env.MAX_CONTEXT_CHUNKS) {
      return merged;
    }
  }

  if (merged.length > 0) {
    return merged;
  }

  return DocumentChunkModel.find({ documentId, ownerId })
    .sort({ chunkIndex: 1 })
    .limit(env.MAX_CONTEXT_CHUNKS)
    .select("_id content chunkIndex")
    .lean<Array<{ _id: Types.ObjectId; content: string; chunkIndex: number }>>()
    .then((chunks) =>
      chunks.map((chunk) => ({
        _id: chunk._id,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        score: 0,
      })),
    );
}

function buildPrompt(question: string, contextChunks: Array<{ content: string; chunkIndex: number }>): string {
  const context = contextChunks.map((chunk) => `Chunk ${chunk.chunkIndex}:\n${chunk.content}`).join("\n\n---\n\n");

  return [
    "You are an AI assistant answering questions from provided document context.",
    "Rules:",
    "1) Use only the context below.",
    "2) If context is insufficient, clearly say what is missing.",
    "3) Keep the answer concise and factual.",
    "4) Use clean markdown headings and bullet points when helpful.",
    "",
    "Context:",
    context,
    "",
    `Question: ${question}`,
    "",
    "Answer:",
  ].join("\n");
}

async function saveConversation(
  ownerObjectId: Types.ObjectId,
  documentObjectId: Types.ObjectId,
  question: string,
  answer: string,
  chunks: RankedChunk[],
  prompt: string,
  startTime: number,
): Promise<void> {
  const inputTokensEstimate = estimateTokensFromText(prompt);
  const outputTokensEstimate = estimateTokensFromText(answer);

  await ConversationModel.create({
    ownerId: ownerObjectId,
    documentId: documentObjectId,
    question,
    answer,
    sourceChunkIds: chunks.map((chunk) => chunk._id),
    model: env.GEMINI_MODEL,
    latencyMs: Date.now() - startTime,
    inputTokensEstimate,
    outputTokensEstimate,
  });
}

async function prepareQuestionContext(ownerId: string, input: AskQuestionInput) {
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

  return {
    ownerObjectId,
    documentObjectId,
    documentId: document._id.toString(),
    chunks,
    prompt,
  };
}

export async function askQuestion(ownerId: string, input: AskQuestionInput): Promise<ChatResponse> {
  const prepared = await prepareQuestionContext(ownerId, input);
  const startTime = Date.now();

  let answer = "";
  try {
    const model = geminiClient.getGenerativeModel({ model: env.GEMINI_MODEL });
    const response = await model.generateContent(prepared.prompt);
    answer = response.response.text().trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new AppError(`Gemini request failed: ${error.message}`, 502, "GEMINI_ERROR");
    }
    throw new AppError("Gemini request failed", 502, "GEMINI_ERROR");
  }

  if (!answer) {
    throw new AppError("Gemini returned an empty response", 502, "GEMINI_EMPTY_RESPONSE");
  }

  await saveConversation(
    prepared.ownerObjectId,
    prepared.documentObjectId,
    input.question,
    answer,
    prepared.chunks,
    prepared.prompt,
    startTime,
  );

  return {
    answer,
    documentId: prepared.documentId,
    sourceChunkIds: prepared.chunks.map((chunk) => chunk._id.toString()),
  };
}

export async function askQuestionStream(
  ownerId: string,
  input: AskQuestionInput,
  onToken: (token: string) => Promise<void> | void,
): Promise<ChatResponse> {
  const prepared = await prepareQuestionContext(ownerId, input);
  const startTime = Date.now();
  const model = geminiClient.getGenerativeModel({ model: env.GEMINI_MODEL });
  const streamResult = await model.generateContentStream(prepared.prompt);

  let answer = "";
  for await (const chunk of streamResult.stream) {
    const token = chunk.text();
    if (!token) {
      continue;
    }
    answer += token;
    await onToken(token);
  }

  answer = answer.trim();
  if (!answer) {
    throw new AppError("Gemini returned an empty response", 502, "GEMINI_EMPTY_RESPONSE");
  }

  await saveConversation(
    prepared.ownerObjectId,
    prepared.documentObjectId,
    input.question,
    answer,
    prepared.chunks,
    prepared.prompt,
    startTime,
  );

  return {
    answer,
    documentId: prepared.documentId,
    sourceChunkIds: prepared.chunks.map((chunk) => chunk._id.toString()),
  };
}
