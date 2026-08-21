type RateWindow = { count: number; resetAt: number };

const buckets = new Map<string, RateWindow>();

/** Lightweight in-process guard for high-risk mutations. Platform/WAF limits remain recommended in production. */
export function consumeRateLimit(scope: string, subject: string | number, limit: number, windowMs: number) {
  const key = `${scope}:${subject}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

setInterval(() => {
  const now = Date.now();
  buckets.forEach((value, key) => {
    if (value.resetAt <= now) buckets.delete(key);
  });
}, 10 * 60 * 1000).unref();
