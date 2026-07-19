import { useCallback, useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "../app/providers/use-toast";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { DocumentItem } from "../types/api";

export function ChatPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sourceChunkIds, setSourceChunkIds] = useState<string[]>([]);
  const [askError, setAskError] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    setDocumentsError("");
    try {
      const response = await httpClient.get<{ success: boolean; data: DocumentItem[] }>("/documents");
      const nextDocuments = response.data.data;
      setDocuments(nextDocuments);
      if (nextDocuments.length === 0) {
        setSelectedDocumentId("");
        setAnswer("");
        setSourceChunkIds([]);
        return;
      }

      if (!selectedDocumentId || !nextDocuments.some((item) => item.id === selectedDocumentId)) {
        setSelectedDocumentId(nextDocuments[0].id);
      }
    } catch (error) {
      setDocuments([]);
      setSelectedDocumentId("");
      setDocumentsError(getApiErrorMessage(error));
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [selectedDocumentId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    setAskError("");
    setAnswer("");
    setSourceChunkIds([]);
  }, [selectedDocumentId]);

  const handleAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDocumentId) {
      const message = "Please select a document.";
      setAskError(message);
      showToast(message, "error");
      return;
    }

    if (!question.trim()) {
      const message = "Please enter a question.";
      setAskError(message);
      showToast(message, "error");
      return;
    }

    setIsAsking(true);
    setAskError("");
    setAnswer("");
    setSourceChunkIds([]);
    try {
      const response = await httpClient.post<{
        success: boolean;
        data: { answer: string; documentId: string; sourceChunkIds: string[] };
      }>("/chat/ask", {
        question: question.trim(),
        documentId: selectedDocumentId,
      });
      setAnswer(response.data.data.answer);
      setSourceChunkIds(response.data.data.sourceChunkIds);
      showToast("Answer generated", "success");
    } catch (error) {
      const message = getApiErrorMessage(error);
      setAskError(message);
      showToast(message, "error");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <PageShell title="Chat" description="Ask questions about a selected document.">
      {isLoadingDocuments ? <LoadingState label="Loading documents..." /> : null}
      {!isLoadingDocuments && documentsError ? (
        <ErrorState message={documentsError} onRetry={() => void loadDocuments()} />
      ) : null}
      {!isLoadingDocuments && !documentsError && documents.length === 0 ? (
        <EmptyState message="Upload at least one document to start asking questions." />
      ) : null}

      {!isLoadingDocuments && !documentsError && documents.length > 0 ? (
        <form className="space-y-4" onSubmit={handleAsk}>
          <div className="space-y-1">
            <label htmlFor="documentId" className="text-sm font-medium text-slate-700">
              Document
            </label>
            <select
              id="documentId"
              value={selectedDocumentId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title || document.originalFilename}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="question" className="text-sm font-medium text-slate-700">
              Question
            </label>
            <textarea
              id="question"
              required
              rows={4}
              minLength={3}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              placeholder="Ask something specific about your document..."
            />
          </div>
          {askError ? <ErrorState message={askError} /> : null}
          <button
            type="submit"
            disabled={isAsking}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {isAsking ? "Asking..." : "Ask AI"}
          </button>
        </form>
      ) : null}

      {answer ? (
        <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Answer</h3>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-800 [&_code]:rounded [&_code]:bg-slate-200 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:leading-6 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_ul]:ml-5 [&_ul]:list-disc">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </div>
          <p className="text-xs text-slate-500">
            {sourceChunkIds.length > 0
              ? `Grounded using ${sourceChunkIds.length} source chunk${sourceChunkIds.length === 1 ? "" : "s"}.`
              : "No source chunks were returned."}
          </p>
        </section>
      ) : null}
    </PageShell>
  );
}
