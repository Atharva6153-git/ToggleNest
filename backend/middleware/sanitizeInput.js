/**
 * Defence-in-depth input sanitisation.
 *
 * Mongoose does not use SQL, but stored HTML is still dangerous for any client
 * that renders API data as raw HTML. These fields are plain text, so all
 * HTML tags and active URL schemes are removed before validation/saving.
 */

const SECRET_FIELDS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmNewPassword',
  'idToken',
]);

const MAX_STRING_LENGTH = 20000;

const stripControlCharacters = (value) =>
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

const stripActiveMarkup = (value) =>
  value
    // Remove full script/style/iframe blocks including their contents.
    .replace(/<\s*(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    // Remove standalone dangerous tags.
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|svg|math|link|meta|base)\b[^>]*>/gi, '')
    // Remove inline event handlers (onclick=, onerror=, ...).
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Neutralise javascript:/vbscript:/data HTML URLs.
    .replace(/\b(href|src|action)\s*=\s*(?:"|')?\s*(?:javascript|vbscript|data)\s*:[^"'\s>]*/gi, '$1="#"')
    // Strip any remaining tags (plain-text fields never need them).
    .replace(/<[^>]*>/g, '');

const sanitizeString = (value) => {
  if (value.length > MAX_STRING_LENGTH) {
    return `Value exceeds the maximum length of ${MAX_STRING_LENGTH} characters`;
  }
  return stripActiveMarkup(stripControlCharacters(value));
};

const sanitizeNode = (node, key) => {
  if (typeof node === 'string') {
    if (SECRET_FIELDS.has(key)) return node;
    return sanitizeString(node);
  }

  if (Array.isArray(node)) {
    for (let index = 0; index < node.length; index += 1) {
      node[index] = sanitizeNode(node[index], key);
    }
    return node;
  }

  if (node && typeof node === 'object') {
    for (const childKey of Object.keys(node)) {
      node[childKey] = sanitizeNode(node[childKey], childKey);
    }
  }

  return node;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') sanitizeNode(req.body);
  if (req.params && typeof req.params === 'object') sanitizeNode(req.params);

  // In Express 5 req.query can be a getter, so guard the mutation.
  try {
    if (req.query && typeof req.query === 'object') sanitizeNode(req.query);
  } catch {
    // Read-only query objects are still validated by each route.
  }

  next();
};

module.exports = {
  sanitizeInputs,
  sanitizeString,
};
