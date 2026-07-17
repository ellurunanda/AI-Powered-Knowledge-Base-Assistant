import { readFile } from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import { AppError } from "../../utils/app-error";

function normalizeFileType(mimeType: string, filePath: string): "pdf" | "text" {
  const extension = path.extname(filePath).toLowerCase();
  if (mimeType === "application/pdf" || extension === ".pdf") {
    return "pdf";
  }
  return "text";
}

export async function extractTextFromDocument(filePath: string, mimeType: string): Promise<string> {
  const fileType = normalizeFileType(mimeType, filePath);

  if (fileType === "pdf") {
    const buffer = await readFile(filePath);
    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim();
    if (!text) {
      throw new AppError("Could not extract text from PDF", 422);
    }
    return text;
  }

  const text = await readFile(filePath, "utf-8");
  const normalized = text.trim();
  if (!normalized) {
    throw new AppError("Uploaded file has no readable text content", 422);
  }
  return normalized;
}

