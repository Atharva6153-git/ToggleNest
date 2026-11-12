#!/usr/bin/env node

/**
 * Source-tree secret scanner.
 *
 * There is no git history in this workspace, so this scans every tracked-looking
 * source file (excluding dependencies, build output, and local env files) for
 * high-confidence credential patterns. Run it in CI and before deployment:
 *
 *   npm run security:secrets
 *
 * Exits with code 1 when a likely secret is found.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.cache',
  '.next',
  '.vite',
  'logs',
  '.playwright',
]);

const SKIP_FILE_PATTERNS = [
  /package-lock\.json$/i,
  /yarn\.lock$/i,
  /pnpm-lock\.yaml$/i,
  /\.map$/i,
  /\.min\.(js|css)$/i,
  /\.(png|jpe?g|gif|webp|ico|svg|pdf|woff2?|ttf|eot|mp4|mov)$/i,
  // Local env files are expected to contain real values and are gitignored.
  /(^|\/)\.env(\.|$)/i,
  // Service account / private key files are gitignored by design.
  /(serviceaccountkey|service-account|firebase-adminsdk|gcloud-key)/i,
  /\.(pem|key|p12|pfx|keystore|jks)$/i,
  /checkSecrets\.js$/i,
];

const PLACEHOLDER = /(your[_-]|example|placeholder|changeme|change-me|dummy|sample|xxxx|<[^>]+>|\.\.\.|redacted|test[_-]?secret)/i;

/**
 * Each rule: name, regex (global), and an optional validator to filter obvious
 * placeholders / documentation examples.
 */
const RULES = [
  {
    name: 'Google/Firebase API key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
  },
  {
    name: 'Google service account private key',
    pattern: /-----BEGIN (RSA |EC |)PRIVATE KEY-----/g,
  },
  {
    name: 'AWS access key ID',
    pattern: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    name: 'GitHub token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  },
  {
    name: 'Slack token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    name: 'Stripe live secret key',
    pattern: /\bsk_live_[A-Za-z0-9]{16,}\b/g,
  },
  {
    name: 'MongoDB URI with embedded credentials',
    pattern: /mongodb(?:\+srv)?:\/\/[^\s/'"]+:[^\s/'"]+@[^\s'"]+/g,
  },
  {
    name: 'Cloudinary URL with embedded credentials',
    pattern: /cloudinary:\/\/\d+:[^\s'"@]+@[^\s'"]+/g,
  },
  {
    name: 'JWT-looking token',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    name: 'Secret assigned to a credential-like variable',
    pattern:
      /\b(JWT_SECRET|JWT_PRIVATE_KEY|SESSION_SECRET|COOKIE_SECRET|CLOUDINARY_API_SECRET|FIREBASE_PRIVATE_KEY|CLIENT_SECRET|API_SECRET|PRIVATE_KEY|ACCESS_TOKEN|REFRESH_TOKEN|GITHUB_TOKEN)\b\s*[=:]\s*["']?([A-Za-z0-9+/_=.-]{20,})["']?/g,
    validate: (match) => !PLACEHOLDER.test(match[0]) && !PLACEHOLDER.test(match[2]),
  },
];

const walk = (directory, results = []) => {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      walk(absolutePath, results);
      continue;
    }

    if (!entry.isFile()) continue;
    const normalisedPath = absolutePath.replace(/\\/g, '/');
    if (SKIP_FILE_PATTERNS.some((pattern) => pattern.test(normalisedPath))) continue;
    results.push(absolutePath);
  }

  return results;
};

const lineNumberAt = (content, index) => content.slice(0, index).split('\n').length;

const findings = [];
const files = walk(repoRoot);

for (const file of files) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  // Skip very large generated files.
  if (content.length > 2 * 1024 * 1024) continue;

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(content)) !== null) {
      if (rule.validate && !rule.validate(match)) continue;

      const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/');
      findings.push({
        file: relativePath,
        line: lineNumberAt(content, match.index),
        rule: rule.name,
        // Never echo the full secret back into CI logs.
        preview: `${String(match[0]).slice(0, 6)}…${String(match[0]).slice(-2)}`,
      });

      if (match.index === rule.pattern.lastIndex) rule.pattern.lastIndex += 1;
    }
  }
}

if (findings.length === 0) {
  console.log(`Secret scan passed: no credentials found in ${files.length} source files.`);
  process.exit(0);
}

console.error('Secret scan FAILED. Remove credentials from source and use env vars:\n');
for (const finding of findings) {
  console.error(`  ${finding.file}:${finding.line}  [${finding.rule}]  (${finding.preview})`);
}
console.error(
  '\nIf a real secret was committed, rotate it immediately with the provider. ' +
    'Git history must be rewritten before the repository is shared.'
);

process.exit(1);
