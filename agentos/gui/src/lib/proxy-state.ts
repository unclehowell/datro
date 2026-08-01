// ─── Shared Proxy State ────────────────────────────────────
// Module-level state shared across all API routes in the same process

export interface ProxyLock {
  sessionId: string;
  origin: string;
  lockedAt: number;
  expiresAt: number;
}

let proxyLock: ProxyLock | null = null;

export function isProxyLocked(): boolean {
  if (!proxyLock) return false;
  if (Date.now() > proxyLock.expiresAt) {
    proxyLock = null;
    return false;
  }
  return true;
}

export function getProxyLock(): ProxyLock | null {
  if (!isProxyLocked()) return null;
  return proxyLock;
}

export function lockForProxy(sessionId: string, origin: string) {
  proxyLock = {
    sessionId,
    origin,
    lockedAt: Date.now(),
    expiresAt: Date.now() + 300000, // 5 min
  };
}

export function unlockProxy() {
  proxyLock = null;
}
