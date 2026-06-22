"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight live updates: re-runs the server component tree on an interval so
 * fresh ISR data is pulled in, without converting the page to a client fetch.
 * Mount only when there is something live to track.
 */
export function AutoRefresh({ seconds = 20, enabled = true }: { seconds?: number; enabled?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds, enabled]);
  return null;
}
