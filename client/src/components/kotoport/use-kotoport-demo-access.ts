import { useCallback, useEffect, useRef, useState } from "react";

const endpoint = "/api/kotoport-demo";
const accessTimeoutMs = 10000;

function readExpiration(value: unknown): number | null {
  if (!value || typeof value !== "object" || !("authorized" in value) || value.authorized !== true
    || !("expiresAt" in value) || typeof value.expiresAt !== "string") return null;
  const expiresAt = Date.parse(value.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now() ? expiresAt : null;
}

export function useKotoportDemoAccess() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const expiresAtRef = useRef<number | null>(null);
  const expirationTimerRef = useRef<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestVersionRef = useRef(0);
  const mountedRef = useRef(false);

  const invalidate = useCallback(() => {
    requestVersionRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    if (expirationTimerRef.current !== null) window.clearTimeout(expirationTimerRef.current);
    expirationTimerRef.current = null;
    expiresAtRef.current = null;
    if (mountedRef.current) setIsAuthorized(false);
  }, []);

  const canUseDemo = useCallback(() => {
    if (!mountedRef.current || expiresAtRef.current === null) return false;
    if (expiresAtRef.current <= Date.now()) {
      invalidate();
      return false;
    }
    return true;
  }, [invalidate]);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    async function checkAccess(token?: string) {
      // Focus changes during a one-time redemption must not cancel or repeat it.
      if (requestRef.current) return;
      const controller = new AbortController();
      const version = ++requestVersionRef.current;
      requestRef.current = controller;
      const isCurrent = () => active && requestVersionRef.current === version;
      const timeout = window.setTimeout(() => { if (isCurrent()) invalidate(); }, accessTimeoutMs);
      try {
        const response = await fetch(`${endpoint}/${token === undefined ? "access" : "redeem"}`, {
          method: token === undefined ? "GET" : "POST",
          ...(token === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }),
          cache: "no-store", credentials: "same-origin", mode: "same-origin", redirect: "error", signal: controller.signal,
        });
        if (!response.ok || !response.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
          if (isCurrent()) invalidate();
          return;
        }
        const expiresAt = readExpiration(await response.json());
        if (!isCurrent()) return;
        if (expiresAt === null) {
          invalidate();
          return;
        }
        if (expirationTimerRef.current !== null) window.clearTimeout(expirationTimerRef.current);
        expiresAtRef.current = expiresAt;
        expirationTimerRef.current = window.setTimeout(invalidate, Math.min(expiresAt - Date.now(), 2147483647));
        setIsAuthorized(true);
      } catch {
        if (isCurrent()) invalidate();
      } finally {
        window.clearTimeout(timeout);
        if (requestRef.current === controller) requestRef.current = null;
      }
    }

    function consumeInvitation() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      if (!fragment.has("demo-invite")) return false;
      const tokens = fragment.getAll("demo-invite");
      fragment.delete("demo-invite");
      invalidate();
      try {
        const remainingHash = fragment.toString();
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${remainingHash ? `#${remainingHash}` : ""}`);
      } catch {
        return true;
      }
      if (tokens.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(tokens[0])) void checkAccess(tokens[0]);
      return true;
    }

    const recheckAccess = () => {
      if (document.hidden) return;
      if (expiresAtRef.current !== null && expiresAtRef.current <= Date.now()) invalidate();
      void checkAccess();
    };
    const onHashChange = () => { consumeInvitation(); };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("focus", recheckAccess);
    document.addEventListener("visibilitychange", recheckAccess);
    // StrictMode discards its first setup synchronously. Only the live setup consumes the hash.
    queueMicrotask(() => { if (active && !consumeInvitation()) void checkAccess(); });
    return () => {
      active = false;
      mountedRef.current = false;
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("focus", recheckAccess);
      document.removeEventListener("visibilitychange", recheckAccess);
      invalidate();
    };
  }, [invalidate]);

  return { isAuthorized, canUseDemo, invalidate };
}
