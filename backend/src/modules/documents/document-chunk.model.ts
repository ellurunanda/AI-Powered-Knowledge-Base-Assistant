import { Schema, Types, model } from "mongoose";

export interface DocumentChunk {
  documentId: Types.ObjectId;
  ownerId: Types.ObjectId;
  chunkIndex: number;
  content: string;
  tokenCountEstimate: number;
  charStart: number;
  charEnd: number;
}

const documentChunkSchema = new Schema<DocumentChunk>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Document",
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    tokenCountEstimate: {
      type: Number,
      required: true,
      min: 1,
    },
    charStart: {
      type: Number,
      required: true,
      min: 0,
    },
    charEnd: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
documentChunkSchema.index({ ownerId: 1, documentId: 1 });
documentChunkSchema.index({ content: "text" });

export const DocumentChunkModel = model<DocumentChunk>("DocumentChunk", documentChunkSchema);

