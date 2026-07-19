import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "../app/providers/use-toast";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { DocumentItem, DocumentPreview } from "../types/api";

export function UploadPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [previewData, setPreviewData] = useState<DocumentPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewingDocumentId, setPreviewingDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    setDocumentsError("");
    try {
      const response = await httpClient.get<{ success: boolean; data: DocumentItem[] }>("/documents");
      setDocuments(response.data.data);
    } catch (error) {
      setDocuments([]);
      setDocumentsError(getApiErrorMessage(error));
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      const message = "Please choose a file before uploading.";
      setUploadError(message);
      showToast(message, "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) {
      formData.append("title", title.trim());
    }

    setIsUploading(true);
    setUploadError("");
    setUploadMessage("");
    try {
      await httpClient.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setUploadMessage("Upload successful.");
      showToast("Document uploaded successfully", "success");
      setTitle("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadDocuments();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setUploadError(message);
      showToast(message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = async (documentId: string) => {
    setIsPreviewLoading(true);
    setPreviewingDocumentId(documentId);
    setPreviewError("");
    try {
      const response = await httpClient.get<{ success: boolean; data: DocumentPreview }>(
        `/documents/${documentId}/preview`,
      );
      const preview = response.data.data;
      setPreviewData(preview);
      showToast(
        preview.isTruncated
          ? "Document preview loaded (partial content shown)"
          : "Document preview loaded",
        "success",
      );
    } catch (error) {
      setPreviewData(null);
      const message = getApiErrorMessage(error);
      setPreviewError(message);
      showToast(message, "error");
    } finally {
      setIsPreviewLoading(false);
      setPreviewingDocumentId(null);
    }
  };

  const handleDelete = async (documentToDelete: DocumentItem) => {
    const confirmation = window.confirm(
      `Delete "${documentToDelete.title || documentToDelete.originalFilename}"? This will also delete related chat history.`,
    );

    if (!confirmation) {
      return;
    }

    setDeletingDocumentId(documentToDelete.id);
    try {
      await httpClient.delete(`/documents/${documentToDelete.id}`);
      showToast("Document deleted successfully", "success");

      if (previewData?.documentId === documentToDelete.id) {
        setPreviewData(null);
      }

      await loadDocuments();
    } catch (error) {
      const message = getApiErrorMessage(error);
      showToast(message, "error");
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <PageShell title="Upload" description="Upload PDF, TXT, and Markdown documents.">
      <form className="space-y-4 rounded-lg border border-slate-200 p-4" onSubmit={handleUpload}>
        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="file" className="text-sm font-medium text-slate-700">
            File
          </label>
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            accept=".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500">Supported: PDF, TXT, Markdown</p>
        </div>
        {uploadError ? <ErrorState message={uploadError} /> : null}
        {uploadMessage ? <p className="text-sm text-emerald-700">{uploadMessage}</p> : null}
        <button
          type="submit"
          disabled={isUploading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
        >
          {isUploading ? "Uploading..." : "Upload document"}
        </button>
      </form>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Uploaded documents</h3>
        {isLoadingDocuments ? <LoadingState label="Loading documents..." /> : null}
        {!isLoadingDocuments && documentsError ? (
          <ErrorState message={documentsError} onRetry={() => void loadDocuments()} />
        ) : null}
        {!isLoadingDocuments && !documentsError && documents.length === 0 ? (
          <EmptyState message="No documents uploaded yet." />
        ) : null}
        {!isLoadingDocuments && !documentsError && documents.length > 0 ? (
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {document.title || document.originalFilename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {document.mimeType} • {Math.ceil(document.sizeInBytes / 1024)} KB •{" "}
                      {document.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handlePreview(document.id)}
                      disabled={isPreviewLoading}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      {isPreviewLoading && previewingDocumentId === document.id ? "Loading..." : "Preview"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(document)}
                      disabled={deletingDocumentId === document.id}
                      className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingDocumentId === document.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {previewError ? <ErrorState message={previewError} /> : null}
        {previewData ? (
          <div className="space-y-2 rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Preview: {previewData.title || previewData.originalFilename}
                </h4>
                <p className="text-xs text-slate-500">
                  {previewData.mimeType} • {previewData.totalCharacters} characters
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewData(null);
                  showToast("Document preview closed", "info");
                }}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">
              {previewData.previewText}
            </pre>
            {previewData.isTruncated ? (
              <p className="text-xs text-slate-500">
                Preview truncated for readability. Open the full file locally for complete content.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
