import { Schema, Types, model } from "mongoose";

export type DocumentStatus = "uploaded" | "processing" | "ready" | "failed";

interface DocumentMetadata {
  extension: string;
}

export interface Document {
  ownerId: Types.ObjectId;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  sizeInBytes: number;
  storagePath: string;
  title?: string;
  uploadDate: Date;
  status: DocumentStatus;
  metadata: DocumentMetadata;
}

const documentSchema = new Schema<Document>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    storedFilename: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    sizeInBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    storagePath: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
      index: true,
    },
    metadata: {
      extension: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

documentSchema.index({ ownerId: 1, uploadDate: -1 });
documentSchema.index({ title: "text", originalFilename: "text" });

export const DocumentModel = model<Document>("Document", documentSchema);
