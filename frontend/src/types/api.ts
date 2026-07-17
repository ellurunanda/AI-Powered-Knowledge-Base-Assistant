export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DocumentItem {
  id: string;
  ownerId: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  sizeInBytes: number;
  uploadDate: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  title?: string;
  metadata: {
    extension: string;
  };
}

export interface ConversationItem {
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
  createdAt: string;
  updatedAt: string;
}

export interface DashboardAnalytics {
  totalDocuments: number;
  questionsAsked: number;
  averageQuestionsPerDocument: number;
  recentUploads: Array<{
    id: string;
    title?: string;
    originalFilename: string;
    uploadDate: string;
    status: "uploaded" | "processing" | "ready" | "failed";
    sizeInBytes: number;
    mimeType: string;
  }>;
}

export interface SearchDocumentItem {
  id: string;
  title?: string;
  originalFilename: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  uploadDate: string;
  mimeType: string;
  sizeInBytes: number;
}

export interface SearchConversationItem {
  id: string;
  documentId?: string;
  question: string;
  answer: string;
  createdAt: string;
}
