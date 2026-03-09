export interface ExtractedArtifactFile {
  path: string;
  language: string;
  content: string;
}

function normalizePath(value: string): string {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

function isLikelyPath(value: string): boolean {
  return /^[\w./-]+\.(tsx?|jsx?|json|css|md|html|py|txt|ya?ml|sql|sh)$/i.test(value.trim());
}

function extractDirectivePath(meta: string, code: string): { path: string | null; content: string } {
  const metaPath = meta.match(/(?:file|path|title)=['"]?([^'"\n]+)['"]?/i)?.[1]
    || meta.split(/\s+/).slice(1).find(token => isLikelyPath(token))
    || null;

  const lines = code.split(/\r?\n/);
  const firstLine = lines[0]?.trim() || '';
  const lineDirective = firstLine.match(/^(?:\/\/|#|\/\*+|<!--)\s*(?:file|path)\s*:\s*([^*<>]+?)(?:\*\/|-->)?\s*$/i)?.[1];

  if (lineDirective && isLikelyPath(lineDirective)) {
    return { path: normalizePath(lineDirective), content: lines.slice(1).join('\n').trim() };
  }

  return { path: metaPath ? normalizePath(metaPath) : null, content: code.trim() };
}

function findFilenameFromContext(context: string): string | null {
  const lines = context.split(/\r?\n/).slice(-8).reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(file(name)?|path)\s*:/i.test(trimmed)) {
      const candidate = normalizePath(trimmed.split(':').slice(1).join(':'));
      if (candidate) return candidate;
    }
    if (/^#{1,6}\s+/i.test(trimmed)) {
      const headingCandidate = normalizePath(trimmed.replace(/^#{1,6}\s+/, ''));
      if (isLikelyPath(headingCandidate)) return headingCandidate;
    }
    if (/^[-*]\s+/i.test(trimmed)) {
      const bulletCandidate = normalizePath(trimmed.replace(/^[-*]\s+/, ''));
      if (isLikelyPath(bulletCandidate)) return bulletCandidate;
    }
    if (isLikelyPath(trimmed)) {
      return normalizePath(trimmed);
    }
    const inlineMatch = trimmed.match(/([\w./-]+\.(tsx?|jsx?|json|css|md|html|py|txt|ya?ml|sql|sh))/i);
    if (inlineMatch) return normalizePath(inlineMatch[1]);
  }
  return null;
}

export function extractArtifactFiles(markdown: string): ExtractedArtifactFile[] {
  const files: ExtractedArtifactFile[] = [];
  const regex = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown))) {
    const meta = (match[1] || '').trim();
    const code = match[2] || '';
    const before = markdown.slice(0, match.index);
    const { path: explicitPath, content } = extractDirectivePath(meta, code);
    const inferredPath = explicitPath || findFilenameFromContext(before);
    const language = meta.split(/\s+/)[0] || 'txt';

    if (!inferredPath || !content) continue;
    files.push({ path: inferredPath, language, content });
  }

  return Array.from(new Map(files.map(file => [file.path, file])).values());
}