import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./error";

function createAxiosError(data: unknown, status = 400) {
  return new AxiosError(
    "Request failed",
    undefined,
    { headers: {} } as InternalAxiosRequestConfig,
    undefined,
    {
      data,
      status,
      statusText: "Error",
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
    },
  );
}

describe("getApiErrorMessage", () => {
  it("maps Gemini provider errors to a user-friendly message", () => {
    const error = createAxiosError({
      message: "Gemini request failed",
      code: "GEMINI_ERROR",
    });

    expect(getApiErrorMessage(error)).toBe(
      "AI request failed. Check your Gemini API key, model name, and project quota.",
    );
  });

  it("maps rate-limit responses to a retry message", () => {
    const error = createAxiosError(
      {
        message: "Too many requests",
        code: "RATE_LIMITED",
      },
      429,
    );

    expect(getApiErrorMessage(error)).toBe(
      "Too many requests right now. Please wait a moment and try again.",
    );
  });

  it("falls back to response message when no custom mapping exists", () => {
    const error = createAxiosError({ message: "Custom backend validation message" }, 400);

    expect(getApiErrorMessage(error)).toBe("Custom backend validation message");
  });
});
