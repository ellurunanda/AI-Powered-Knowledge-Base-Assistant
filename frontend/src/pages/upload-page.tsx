import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "../app/providers/use-toast";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { DocumentItem } from "../types/api";

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
                <p className="font-medium text-slate-900">{document.title || document.originalFilename}</p>
                <p className="text-xs text-slate-500">
                  {document.mimeType} • {Math.ceil(document.sizeInBytes / 1024)} KB • {document.status}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </PageShell>
  );
}
