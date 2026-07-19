import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { ConversationItem, DocumentItem } from "../types/api";

export function HistoryPage() {
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [conversationsResponse, documentsResponse] = await Promise.all([
        httpClient.get<{
          success: boolean;
          data: ConversationItem[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>("/conversations", {
          params: {
            page,
            limit: 10,
            documentId: documentId || undefined,
          },
        }),
        httpClient.get<{ success: boolean; data: DocumentItem[] }>("/documents"),
      ]);

      setItems(conversationsResponse.data.data);
      setTotalPages(conversationsResponse.data.pagination.totalPages);
      setDocuments(documentsResponse.data.data);
    } catch (loadError) {
      setItems([]);
      setDocuments([]);
      setTotalPages(1);
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [documentId, page]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <PageShell title="History" description="Review your previous AI conversations.">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 space-y-1">
          <label htmlFor="documentFilter" className="text-sm font-medium text-slate-700">
            Filter by document
          </label>
          <select
            id="documentFilter"
            value={documentId}
            onChange={(event) => {
              setDocumentId(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title || doc.originalFilename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? <LoadingState label="Loading conversation history..." /> : null}
      {!isLoading && error ? <ErrorState message={error} onRetry={() => void loadHistory()} /> : null}
      {!isLoading && !error && items.length === 0 ? (
        <EmptyState message="No conversations yet. Ask a question in Chat." />
      ) : null}
      {!isLoading && !error && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">
                {new Date(item.createdAt).toLocaleString()}
                {item.documentTitle ? ` • ${item.documentTitle}` : ""}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Q: {item.question}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">A:</p>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-800 [&_code]:rounded [&_code]:bg-slate-200 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:leading-6 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_ul]:ml-5 [&_ul]:list-disc">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown>
              </div>
            </article>
          ))}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
