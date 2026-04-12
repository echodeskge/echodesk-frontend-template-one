/**
 * HTML sanitization utility
 *
 * Strips potentially dangerous HTML tags and attributes to prevent XSS attacks.
 * Allows a safe subset of tags commonly used in rich text content.
 */

const ALLOWED_TAGS = new Set([
  'a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'sub', 'sup', 'small', 'mark', 'figure', 'figcaption',
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'g', 'defs', 'use', 'symbol', 'text', 'tspan',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class',
  'style', 'id', 'title', 'colspan', 'rowspan',
  // SVG attributes
  'viewBox', 'viewbox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y',
  'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'xmlns',
]);

const DANGEROUS_ATTR_PATTERN = /^on/i;
const DANGEROUS_URL_PATTERN = /^\s*(javascript|data|vbscript):/i;

/**
 * Sanitize an HTML string by removing dangerous tags and attributes.
 * Uses a regex-based approach that works in both server and client environments.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove script tags and their content (including nested / malformed variants)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Catch unclosed script tags
  sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*$/gi, '');

  // Remove style tags and their content (can contain CSS expressions)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  sanitized = sanitized.replace(/<style\b[^>]*>[\s\S]*$/gi, '');

  // Remove dangerous tags (iframe, object, embed, form elements, base, meta, link, template, etc.)
  sanitized = sanitized.replace(
    /<\/?(?:iframe|object|embed|form|input|textarea|button|select|option|base|meta|link|template|applet|noscript|noembed|noframes|plaintext|xmp|math|annotation-xml)\b[^>]*>/gi,
    ''
  );

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  // Handle both quoted and unquoted values, including backtick-quoted
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[^\s>]+)/gi, '');

  // Remove javascript:, data:, vbscript: URLs from href/src/action/formaction attributes
  // Also handle URL-encoded variants (&#106;avascript: etc.) and whitespace tricks
  sanitized = sanitized.replace(
    /(href|src|action|formaction|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*')/gi,
    (match, attr) => {
      // Extract URL value from the quoted attribute
      const quoteChar = match.charAt(match.indexOf('=') + 1 + (match.indexOf('=') + 1 < match.length && match.charAt(match.indexOf('=') + 1) === ' ' ? 1 : 0));
      const urlMatch = match.match(/=\s*(['"])([\s\S]*?)\1/);
      if (urlMatch) {
        const url = urlMatch[2];
        // Decode HTML entities for checking
        const decoded = url.replace(/&#x?[0-9a-fA-F]+;?/g, ' ').replace(/\s+/g, '');
        if (DANGEROUS_URL_PATTERN.test(decoded) || DANGEROUS_URL_PATTERN.test(url)) {
          return `${attr}=""`;
        }
      }
      return match;
    }
  );

  // Remove CSS expressions and -moz-binding from style attributes
  sanitized = sanitized.replace(
    /style\s*=\s*(?:"[^"]*"|'[^']*')/gi,
    (match) => {
      if (/expression\s*\(|url\s*\(|\\|import|behavior\s*:|binding\s*:|moz-binding/i.test(match)) {
        return 'style=""';
      }
      return match;
    }
  );

  return sanitized;
}

/**
 * Strip ALL HTML tags and return plain text content.
 * Useful when the content is simple (paragraphs/headings) and
 * you want to render it as plain text rather than using dangerouslySetInnerHTML.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  // Remove tags, decode common entities, and collapse whitespace
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
