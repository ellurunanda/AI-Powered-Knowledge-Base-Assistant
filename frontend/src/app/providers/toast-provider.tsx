import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { ToastContext, type ToastContextValue } from "./toast-context";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, variant }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const variantStyles =
            toast.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.variant === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-slate-200 bg-white text-slate-800";

          return (
            <div key={toast.id} className={`pointer-events-auto rounded-md border px-3 py-2 text-sm shadow ${variantStyles}`}>
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
