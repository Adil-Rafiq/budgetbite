const parseList = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

const parsePattern = (raw: string | undefined): RegExp | null => {
  if (!raw) return null;
  try {
    return new RegExp(raw);
  } catch (err) {
    console.warn(`[origins] invalid WEB_URL_PATTERN: ${raw}`, err);
    return null;
  }
};

const explicitOrigins = [
  ...parseList(process.env.WEB_URL),
  ...parseList(process.env.WEB_URL_ALLOWLIST),
];

// Static list used by better-auth's `trustedOrigins`. Pattern-based origins
// (e.g. Vercel previews) need to be added to WEB_URL_ALLOWLIST individually
// if they hit /api/auth/*.
export const allowedOrigins: string[] = explicitOrigins.length
  ? explicitOrigins
  : ['http://localhost:3000'];

const previewPattern = parsePattern(process.env.WEB_URL_PATTERN);

export const isAllowedOrigin = (origin: string): boolean => {
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  if (previewPattern && previewPattern.test(normalized)) return true;
  return false;
};
