import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { ConversationItem, DocumentItem } from "../types/api";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSearchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [documentsResponse, conversationsResponse] = await Promise.all([
        httpClient.get<{ success: boolean; data: DocumentItem[] }>("/documents"),
        httpClient.get<{
          success: boolean;
          data: ConversationItem[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>("/conversations", {
          params: { page: 1, limit: 50 },
        }),
      ]);
      setDocuments(documentsResponse.data.data);
      setConversations(conversationsResponse.data.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSearchData();
  }, [loadSearchData]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredDocuments = useMemo(() => {
    if (!normalizedQuery) {
      return documents;
    }
    return documents.filter((doc) => {
      const haystack = `${doc.title || ""} ${doc.originalFilename}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [documents, normalizedQuery]);

  const filteredConversations = useMemo(() => {
    if (!normalizedQuery) {
      return conversations;
    }
    return conversations.filter((item) =>
      `${item.question} ${item.answer}`.toLowerCase().includes(normalizedQuery),
    );
  }, [conversations, normalizedQuery]);

  return (
    <PageShell title="Search" description="Quickly find documents and conversation entries.">
      <div className="space-y-1">
        <label htmlFor="searchInput" className="text-sm font-medium text-slate-700">
          Search query
        </label>
        <input
          id="searchInput"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by filename, question, or answer..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      {isLoading ? <LoadingState label="Loading searchable data..." /> : null}
      {!isLoading && error ? <ErrorState message={error} onRetry={() => void loadSearchData()} /> : null}
      {!isLoading && !error && filteredDocuments.length === 0 && filteredConversations.length === 0 ? (
        <EmptyState message="No matching documents or conversations found." />
      ) : null}

      {!isLoading && !error ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-800">Documents ({filteredDocuments.length})</h3>
            {filteredDocuments.length === 0 ? (
              <EmptyState message="No matching documents." />
            ) : (
              <ul className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <li key={doc.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">{doc.title || doc.originalFilename}</p>
                    <p className="text-xs text-slate-500">{doc.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Conversations ({filteredConversations.length})
            </h3>
            {filteredConversations.length === 0 ? (
              <EmptyState message="No matching conversations." />
            ) : (
              <ul className="space-y-2">
                {filteredConversations.map((item) => (
                  <li key={item.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">Q: {item.question}</p>
                    <p className="line-clamp-2 text-slate-700">A: {item.answer}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
