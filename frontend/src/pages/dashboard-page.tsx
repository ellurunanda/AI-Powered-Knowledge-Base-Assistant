import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "../components/common/empty-state";
import { ErrorState } from "../components/common/error-state";
import { LoadingState } from "../components/common/loading-state";
import { PageShell } from "../components/common/page-shell";
import { getApiErrorMessage } from "../lib/api/error";
import { httpClient } from "../lib/api/http-client";
import type { DashboardAnalytics } from "../types/api";

export function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await httpClient.get<{ success: boolean; data: DashboardAnalytics }>(
        "/analytics/dashboard",
      );
      setAnalytics(response.data.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return <LoadingState label="Loading dashboard analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadAnalytics()} />;
  }

  if (!analytics) {
    return <EmptyState message="No analytics data available yet." />;
  }

  return (
    <PageShell title="Dashboard" description="Your usage insights at a glance.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Documents</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{analytics.totalDocuments}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Questions Asked</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{analytics.questionsAsked}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Avg Questions / Document</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{analytics.averageQuestionsPerDocument}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Recent uploads</h3>
        {analytics.recentUploads.length === 0 ? (
          <EmptyState message="No uploads yet. Start by uploading a document." />
        ) : (
          <ul className="space-y-2">
            {analytics.recentUploads.map((upload) => (
              <li key={upload.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{upload.title || upload.originalFilename}</p>
                <p className="text-xs text-slate-500">
                  {new Date(upload.uploadDate).toLocaleString()} • {upload.status} •{" "}
                  {Math.ceil(upload.sizeInBytes / 1024)} KB
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
