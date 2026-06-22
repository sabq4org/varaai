"use client";

import { useState } from "react";

/**
 * Team / competition crest with a graceful fallback (mirrors iOS AsyncImageLogo).
 * Falls back to a shield glyph when the URL is missing or fails to load.
 */
export function Logo({
  url,
  alt = "",
  size = 24,
}: {
  url?: string | null;
  alt?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size } as const;

  if (!url || failed) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center text-line"
        style={style}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
          <path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z" />
        </svg>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="inline-block shrink-0 object-contain"
      style={style}
      referrerPolicy="no-referrer"
    />
  );
}
