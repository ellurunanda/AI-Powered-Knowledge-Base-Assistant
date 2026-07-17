import { Schema, Types, model } from "mongoose";

export interface Conversation {
  ownerId: Types.ObjectId;
  documentId?: Types.ObjectId;
  question: string;
  answer: string;
  sourceChunkIds: Types.ObjectId[];
  model: string;
  latencyMs: number;
  inputTokensEstimate: number;
  outputTokensEstimate: number;
}

const conversationSchema = new Schema<Conversation>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    sourceChunkIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "DocumentChunk",
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
    inputTokensEstimate: {
      type: Number,
      required: true,
      min: 0,
    },
    outputTokensEstimate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

conversationSchema.index({ ownerId: 1, createdAt: -1 });
conversationSchema.index({ ownerId: 1, documentId: 1, createdAt: -1 });
conversationSchema.index({ question: "text", answer: "text" });

export const ConversationModel = model<Conversation>("Conversation", conversationSchema);

