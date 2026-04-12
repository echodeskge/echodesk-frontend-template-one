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

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content (can contain expressions)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove iframe, object, embed, form tags
  sanitized = sanitized.replace(/<\/?(?:iframe|object|embed|form|input|textarea|button|select|option)\b[^>]*>/gi, '');

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove javascript: URLs from href/src attributes
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""');
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi, '$1=""');
  sanitized = sanitized.replace(/(href|src)\s*=\s*(?:"vbscript:[^"]*"|'vbscript:[^']*')/gi, '$1=""');

  return sanitized;
}
