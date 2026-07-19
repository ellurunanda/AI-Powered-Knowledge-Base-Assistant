import { readFile } from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import pdfParse from "pdf-parse";
import { AppError } from "../../utils/app-error";

const geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);

function normalizeFileType(mimeType: string, filePath: string): "pdf" | "text" | "image" {
  const extension = path.extname(filePath).toLowerCase();
  if (mimeType === "application/pdf" || extension === ".pdf") {
    return "pdf";
  }
  if (
    mimeType.startsWith("image/") ||
    extension === ".png" ||
    extension === ".jpg" ||
    extension === ".jpeg" ||
    extension === ".webp"
  ) {
    return "image";
  }
  return "text";
}

async function extractTextWithGeminiOCR(fileBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const model = geminiClient.getGenerativeModel({ model: env.GEMINI_OCR_MODEL });
    const response = await model.generateContent([
      {
        text: "Extract all readable text from this file. Return plain text only with clean line breaks.",
      },
      {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType,
        },
      },
    ]);

    const text = response.response.text().trim();
    if (!text) {
      throw new AppError("OCR could not detect readable text in the uploaded file", 422, "OCR_EMPTY_RESULT");
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new AppError(`OCR extraction failed: ${error.message}`, 502, "OCR_FAILED");
    }

    throw new AppError("OCR extraction failed", 502, "OCR_FAILED");
  }
}

export async function extractTextFromDocument(filePath: string, mimeType: string): Promise<string> {
  const fileType = normalizeFileType(mimeType, filePath);
  const fileBuffer = await readFile(filePath);

  if (fileType === "pdf") {
    const parsed = await pdfParse(fileBuffer);
    const extractedText = parsed.text?.trim();
    if (extractedText) {
      return extractedText;
    }

    return extractTextWithGeminiOCR(fileBuffer, "application/pdf");
  }

  if (fileType === "image") {
    return extractTextWithGeminiOCR(fileBuffer, mimeType);
  }

  const text = fileBuffer.toString("utf-8");
  const normalized = text.trim();
  if (!normalized) {
    throw new AppError("Uploaded file has no readable text content", 422);
  }
  return normalized;
}
