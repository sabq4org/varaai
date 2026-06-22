// Minimal in-memory TTL cache. The poller is the only process hitting providers,
// which protects us from rate limits. Swap for Redis/Edge KV in production.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export async function withCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<{ value: T; cached: boolean }> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return { value: hit.value, cached: true };
  }
  const value = await loader();
  store.set(key, { value, expiresAt: now + ttlMs });
  return { value, cached: false };
}

export function clearCache(): void {
  store.clear();
}
