import katex from 'katex';

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

  // Fenced code blocks
  html = html.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    return `<div class="code-block"><div class="code-block-header"><span>${lang.trim() || 'code'}</span><button class="code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(unescapeHtml(code.trim()))}')).then(()=>this.textContent='Copied!',()=>{});setTimeout(()=>this.textContent='Copy',2000)">Copy</button></div><pre><code>${code.trim()}</code></pre></div>`;
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
    if (cells.every(c => /^[-:]+$/.test(c))) return '';
    const tag = 'td';
    return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
  });
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, url: string) => {
    if (url.startsWith('javascript:')) return text;
    return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
  });

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Clean up extra <br> around block elements
  html = html.replace(/<br>\s*(<h[1-4]|<ul|<ol|<blockquote|<table|<div)/g, '$1');
  html = html.replace(/(<\/h[1-4]>|<\/ul>|<\/ol>|<\/blockquote>|<\/table>|<\/div>)\s*<br>/g, '$1');

  mathTokens.forEach((value, token) => {
    html = html.replaceAll(token, value);
  });

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
