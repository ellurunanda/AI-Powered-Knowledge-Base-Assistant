interface ChunkResult {
  chunkIndex: number;
  content: string;
  charStart: number;
  charEnd: number;
  tokenCountEstimate: number;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function normalizeText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function chunkText(input: string, chunkSize: number, overlap: number): ChunkResult[] {
  const text = normalizeText(input);
  if (!text) {
    return [];
  }

  const chunks: ChunkResult[] = [];
  let cursor = 0;
  let index = 0;
  const safeOverlap = Math.min(Math.max(0, overlap), chunkSize - 1);

  while (cursor < text.length) {
    const end = Math.min(cursor + chunkSize, text.length);
    const content = text.slice(cursor, end).trim();

    if (content) {
      chunks.push({
        chunkIndex: index,
        content,
        charStart: cursor,
        charEnd: end,
        tokenCountEstimate: estimateTokens(content),
      });
      index += 1;
    }

    if (end === text.length) {
      break;
    }

    cursor = end - safeOverlap;
  }

  return chunks;
}

export function estimateTokensFromText(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

