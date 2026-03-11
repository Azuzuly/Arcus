import katex from 'katex';
import DOMPurify from 'dompurify';

export function renderMarkdown(text: string): string {
  const mathTokens = new Map<string, string>();
  let tokenIndex = 0;
  const withMathPlaceholders = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, expr: string) => {
      const token = `__ARCUS_MATH_BLOCK_${tokenIndex++}__`;
      mathTokens.set(token, `<div class="math-block">${katex.renderToString(expr.trim(), { throwOnError: false, displayMode: true })}</div>`);
      return token;
    })
    .replace(/\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_match, expr: string) => {
      const token = `__ARCUS_MATH_INLINE_${tokenIndex++}__`;
      mathTokens.set(token, katex.renderToString(expr.trim(), { throwOnError: false, displayMode: false }));
      return token;
    });

  let html = escapeHtml(withMathPlaceholders);

  // Fenced code blocks - use data attributes instead of inline onclick
  html = html.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const safeCode = code.trim();
    const encodedCode = encodeURIComponent(unescapeHtml(safeCode));
    return `<div class="code-block"><div class="code-block-header"><span>${lang.trim() || 'code'}</span><button class="code-copy-btn" data-copy-text="${encodedCode}">Copy</button></div><pre><code>${safeCode}</code></pre></div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, match => match.includes('<ul>') ? match : `<ol>${match}</ol>`);

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    const cells = match.split('|').filter(c => c.trim()).map(c => c.trim());
    if (cells.every(c => /^[:-]+$/.test(c))) return '';
    const tag = 'td';
    return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
  });
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>');

  // Links - sanitize href to prevent javascript:, data:, and vbscript: protocol injection
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText: string, url: string) => {
    const trimmedUrl = url.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmedUrl)) return linkText;
    return `<a href="${escapeAttr(trimmedUrl)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Clean up
  html = html.replace(/<br><br>/g, '<br>');

  // Restore math tokens
  for (const [token, rendered] of mathTokens) {
    html = html.replaceAll(token, rendered);
  }

  if (typeof window !== 'undefined') {
    html = DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mover', 'munder', 'munderover', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mtext', 'mspace', 'annotation'],
      ADD_ATTR: ['encoding', 'mathvariant', 'displaystyle', 'scriptlevel', 'xmlns', 'accent', 'accentunder', 'columnalign', 'columnspacing', 'rowspacing', 'fence', 'stretchy', 'symmetric', 'lspace', 'rspace', 'movablelimits', 'separator', 'data-copy-text'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  }

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Initialize code copy buttons via event delegation.
 * Call this once in your app root to enable all copy buttons.
 */
export function initCodeCopyButtons(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.code-copy-btn') as HTMLElement | null;
    if (!btn) return;

    const encoded = btn.getAttribute('data-copy-text');
    if (!encoded) return;

    const text = decodeURIComponent(encoded);
    navigator.clipboard.writeText(text).then(
      () => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      },
      () => { /* clipboard write failed */ }
    );
  });
}
