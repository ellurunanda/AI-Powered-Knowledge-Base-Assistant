import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { SearchConversationItem, SearchDocumentItem } from "../types/api";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<SearchDocumentItem[]>([]);
  const [conversations, setConversations] = useState<SearchConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(async (searchText: string) => {
    const normalized = searchText.trim();
    if (!normalized) {
      setDocuments([]);
      setConversations([]);
      setError("");
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await httpClient.get<{
        success: boolean;
        data: {
          documents: SearchDocumentItem[];
          conversations: SearchConversationItem[];
        };
      }>("/search", {
        params: {
          q: normalized,
          documentLimit: 20,
          conversationLimit: 20,
        },
      });
      setDocuments(response.data.data.documents);
      setConversations(response.data.data.conversations);
    } catch (loadError) {
      setDocuments([]);
      setConversations([]);
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void runSearch(query);
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query, runSearch]);

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
      {!isLoading && error ? <ErrorState message={error} onRetry={() => void runSearch(query)} /> : null}
      {!isLoading && !error && !hasSearched ? (
        <EmptyState message="Type a keyword to search documents and conversations." />
      ) : null}
      {!isLoading && !error && hasSearched && documents.length === 0 && conversations.length === 0 ? (
        <EmptyState message="No matching documents or conversations found." />
      ) : null}

      {!isLoading && !error && hasSearched ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-800">Documents ({documents.length})</h3>
            {documents.length === 0 ? (
              <EmptyState message="No matching documents." />
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">{doc.title || doc.originalFilename}</p>
                    <p className="text-xs text-slate-500">{doc.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-800">Conversations ({conversations.length})</h3>
            {conversations.length === 0 ? (
              <EmptyState message="No matching conversations." />
            ) : (
              <ul className="space-y-2">
                {conversations.map((item) => (
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
