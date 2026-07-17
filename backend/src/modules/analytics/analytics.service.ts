import { Types } from "mongoose";
import { ConversationModel } from "../conversations/conversations.model";
import { DocumentModel } from "../documents/documents.model";
import type { DashboardAnalyticsQuery } from "./analytics.validation";

interface DashboardAnalyticsResult {
  totalDocuments: number;
  questionsAsked: number;
  averageQuestionsPerDocument: number;
  recentUploads: Array<{
    id: string;
    title?: string;
    originalFilename: string;
    uploadDate: Date;
    status: "uploaded" | "processing" | "ready" | "failed";
    sizeInBytes: number;
    mimeType: string;
  }>;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getDashboardAnalytics(
  ownerId: string,
  query: DashboardAnalyticsQuery,
): Promise<DashboardAnalyticsResult> {
  const ownerObjectId = new Types.ObjectId(ownerId);

  const [totalDocuments, questionsAsked, recentUploads] = await Promise.all([
    DocumentModel.countDocuments({ ownerId: ownerObjectId }),
    ConversationModel.countDocuments({ ownerId: ownerObjectId }),
    DocumentModel.find({ ownerId: ownerObjectId })
      .sort({ uploadDate: -1 })
      .limit(query.recentLimit)
      .select("_id title originalFilename uploadDate status sizeInBytes mimeType")
      .lean<{
        _id: Types.ObjectId;
        title?: string;
        originalFilename: string;
        uploadDate: Date;
        status: "uploaded" | "processing" | "ready" | "failed";
        sizeInBytes: number;
        mimeType: string;
      }[]>(),
  ]);

  const averageQuestionsPerDocument =
    totalDocuments === 0 ? 0 : roundToTwoDecimals(questionsAsked / totalDocuments);

  return {
    totalDocuments,
    questionsAsked,
    averageQuestionsPerDocument,
    recentUploads: recentUploads.map((item) => {
      const mapped: DashboardAnalyticsResult["recentUploads"][number] = {
        id: item._id.toString(),
        originalFilename: item.originalFilename,
        uploadDate: item.uploadDate,
        status: item.status,
        sizeInBytes: item.sizeInBytes,
        mimeType: item.mimeType,
      };

      if (item.title) {
        mapped.title = item.title;
      }

      return mapped;
    }),
  };
}
