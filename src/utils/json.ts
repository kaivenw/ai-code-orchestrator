/** JSON extraction helpers tolerant of messy AI output. */

/** Extract all ```json fenced code blocks from a markdown string, in order. */
export function extractMarkdownJsonBlocks(text: string): string[] {
  const blocks: string[] = [];
  const fenceRe = /```(?:json)?\s*\n([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = fenceRe.exec(text)) !== null) {
    const body = match[1].trim();
    if (body.startsWith("{") || body.startsWith("[")) {
      blocks.push(body);
    }
  }
  return blocks;
}

/**
 * Find the last balanced top-level JSON object in free text.
 * Scans from the end, matching braces while respecting strings.
 */
export function findLastJsonObject(text: string): string | null {
  let depth = 0;
  let end = -1;
  let inString = false;
  let escape = false;

  // First find the last closing brace.
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === "}") {
      end = i;
      break;
    }
  }
  if (end === -1) return null;

  // Walk backwards from that closing brace to find its matching open.
  for (let i = end; i >= 0; i--) {
    const ch = text[i];
    // Because we walk backwards, treat string detection loosely:
    // we simply count braces that are not inside obvious strings.
    if (inString) {
      if (ch === '"' && !escape) inString = false;
      escape = ch === "\\" && !escape;
      continue;
    }
    if (ch === '"') {
      inString = true;
      escape = false;
      continue;
    }
    if (ch === "}") depth++;
    else if (ch === "{") {
      depth--;
      if (depth === 0) {
        return text.slice(i, end + 1);
      }
    }
  }
  return null;
}

/** Safe JSON parse returning null on failure. */
export function tryParseJson<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
