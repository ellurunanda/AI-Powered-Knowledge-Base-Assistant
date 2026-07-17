interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

