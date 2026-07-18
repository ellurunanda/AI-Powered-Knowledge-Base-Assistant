import axios from "axios";

interface ApiErrorPayload {
  message?: unknown;
  code?: unknown;
}

function getFriendlyApiMessage(status: number | undefined, code: string | undefined, fallback: string): string {
  if (code === "GEMINI_ERROR") {
    return "AI request failed. Check your Gemini API key, model name, and project quota.";
  }

  if (code === "GEMINI_EMPTY_RESPONSE") {
    return "AI returned an empty answer. Please try again.";
  }

  if (code === "RATE_LIMITED" || status === 429) {
    return "Too many requests right now. Please wait a moment and try again.";
  }

  if (code === "JWT_EXPIRED") {
    return "Your session has expired. Please log in again.";
  }

  if (code === "JWT_INVALID") {
    return "Your session is invalid. Please log in again.";
  }

  if (code === "CORS_ORIGIN_DENIED") {
    return "This frontend origin is not allowed by the backend CORS settings.";
  }

  if (code === "FILE_TOO_LARGE") {
    return "The selected file is too large.";
  }

  if (code === "UNSAFE_INPUT") {
    return "The request contained unsafe input and was rejected.";
  }

  return fallback;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | undefined;
    const status = error.response?.status;
    const message = typeof data?.message === "string" && data.message.trim() ? data.message : error.message;
    const code = typeof data?.code === "string" ? data.code : undefined;
    return getFriendlyApiMessage(status, code, message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
