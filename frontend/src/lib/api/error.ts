import axios from "axios";

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

