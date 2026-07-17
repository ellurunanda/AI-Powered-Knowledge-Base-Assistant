import { Types } from "mongoose";
import { AppError } from "../../utils/app-error";
import { DocumentModel } from "../documents/documents.model";
import { ConversationModel } from "./conversations.model";
import type { ListConversationsQuery } from "./conversations.validation";

interface ListConversationsResult {
  items: Array<{
    id: string;
    ownerId: string;
    documentId?: string;
    documentTitle?: string;
    question: string;
    answer: string;
    sourceChunkIds: string[];
    model: string;
    latencyMs: number;
    inputTokensEstimate: number;
    outputTokensEstimate: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listConversationsByOwner(
  ownerId: string,
  query: ListConversationsQuery,
): Promise<ListConversationsResult> {
  const ownerObjectId = new Types.ObjectId(ownerId);
  const filter: {
    ownerId: Types.ObjectId;
    documentId?: Types.ObjectId;
  } = { ownerId: ownerObjectId };

  if (query.documentId) {
    if (!Types.ObjectId.isValid(query.documentId)) {
      throw new AppError("Invalid document id", 400);
    }
    filter.documentId = new Types.ObjectId(query.documentId);
  }

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    ConversationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .select(
        "_id ownerId documentId question answer sourceChunkIds model latencyMs inputTokensEstimate outputTokensEstimate createdAt updatedAt",
      )
      .lean<{
        _id: Types.ObjectId;
        ownerId: Types.ObjectId;
        documentId?: Types.ObjectId;
        question: string;
        answer: string;
        sourceChunkIds: Types.ObjectId[];
        model: string;
        latencyMs: number;
        inputTokensEstimate: number;
        outputTokensEstimate: number;
        createdAt: Date;
        updatedAt: Date;
      }[]>(),
    ConversationModel.countDocuments(filter),
  ]);

  const documentIds = [
    ...new Set(
      items
        .map((item) => item.documentId?.toString())
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  const documents = documentIds.length
    ? await DocumentModel.find({ _id: { $in: documentIds }, ownerId: ownerObjectId })
        .select("_id title originalFilename")
        .lean<{ _id: Types.ObjectId; title?: string; originalFilename: string }[]>()
    : [];

  const documentTitleById = new Map<string, string>();
  documents.forEach((doc) => {
    const title = doc.title || doc.originalFilename;
    documentTitleById.set(doc._id.toString(), title);
  });

  const mappedItems = items.map((item) => {
    const mapped: ListConversationsResult["items"][number] = {
      id: item._id.toString(),
      ownerId: item.ownerId.toString(),
      question: item.question,
      answer: item.answer,
      sourceChunkIds: item.sourceChunkIds.map((id) => id.toString()),
      model: item.model,
      latencyMs: item.latencyMs,
      inputTokensEstimate: item.inputTokensEstimate,
      outputTokensEstimate: item.outputTokensEstimate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    if (item.documentId) {
      mapped.documentId = item.documentId.toString();
      const docTitle = documentTitleById.get(mapped.documentId);
      if (docTitle) {
        mapped.documentTitle = docTitle;
      }
    }

    return mapped;
  });

  return {
    items: mappedItems,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getConversationById(ownerId: string, conversationId: string) {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new AppError("Invalid conversation id", 400);
  }

  const conversation = await ConversationModel.findOne({
    _id: new Types.ObjectId(conversationId),
    ownerId: new Types.ObjectId(ownerId),
  })
    .select(
      "_id ownerId documentId question answer sourceChunkIds model latencyMs inputTokensEstimate outputTokensEstimate createdAt updatedAt",
    )
    .lean<{
      _id: Types.ObjectId;
      ownerId: Types.ObjectId;
      documentId?: Types.ObjectId;
      question: string;
      answer: string;
      sourceChunkIds: Types.ObjectId[];
      model: string;
      latencyMs: number;
      inputTokensEstimate: number;
      outputTokensEstimate: number;
      createdAt: Date;
      updatedAt: Date;
    } | null>();

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  return {
    id: conversation._id.toString(),
    ownerId: conversation.ownerId.toString(),
    documentId: conversation.documentId?.toString(),
    question: conversation.question,
    answer: conversation.answer,
    sourceChunkIds: conversation.sourceChunkIds.map((id) => id.toString()),
    model: conversation.model,
    latencyMs: conversation.latencyMs,
    inputTokensEstimate: conversation.inputTokensEstimate,
    outputTokensEstimate: conversation.outputTokensEstimate,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

