"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Tên trang wiki (ví dụ: "Star Platinum", "Jonathan Joestar") */
  title: string;
  /** Kích thước thumbnail (px), mặc định 300 */
  size?: number;
  className?: string;
  fallback?: string;
  alt?: string;
}

/**
 * Tự động tải ảnh từ Fandom Wiki theo tên trang.
 * Dùng MediaWiki pageimages API — hỗ trợ CORS qua origin=*
 */
export default function WikiImage({
  title,
  size = 300,
  className = "",
  fallback = "🎭",
  alt,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!title) { setFailed(true); return; }
    setSrc(null);
    setFailed(false);

    const API = "https://jojo.fandom.com/api.php";

    // ── Step 1: pageimages (fast path) ────────────────────────────────────
    const p1 = new URLSearchParams({
      action: "query",
      titles: title,
      prop: "pageimages",
      pithumbsize: String(size),
      format: "json",
      origin: "*",
    });

    fetch(`${API}?${p1}`)
      .then((r) => r.json())
      .then(async (data) => {
        const pages = data?.query?.pages ?? {};
        const page = Object.values(pages)[0] as { thumbnail?: { source?: string } };
        const url = page?.thumbnail?.source;
        if (url) { setSrc(url); return; }

        // ── Step 2: parse → images list ──────────────────────────────────
        const p2 = new URLSearchParams({
          action: "parse",
          page: title,
          prop: "images",
          format: "json",
          origin: "*",
        });
        const res2 = await fetch(`${API}?${p2}`);
        const data2 = await res2.json();
        const images: string[] = data2?.parse?.images ?? [];

        // Pick first image that looks like a portrait (not icon/logo/badge)
        const portrait = images.find((img) => {
          const l = img.toLowerCase();
          return (
            !l.includes("icon") && !l.includes("logo") && !l.includes("badge") &&
            !l.includes("symbol") && !l.includes("arrow") &&
            (l.endsWith(".png") || l.endsWith(".jpg") || l.endsWith(".jpeg") || l.endsWith(".webp"))
          );
        });
        if (!portrait) { setFailed(true); return; }

        // ── Step 3: imageinfo → get thumb URL ────────────────────────────
        const p3 = new URLSearchParams({
          action: "query",
          titles: `File:${portrait}`,
          prop: "imageinfo",
          iiprop: "url",
          iiurlwidth: String(size),
          format: "json",
          origin: "*",
        });
        const res3 = await fetch(`${API}?${p3}`);
        const data3 = await res3.json();
        const pages3 = data3?.query?.pages ?? {};
        const fileInfo = Object.values(pages3)[0] as { imageinfo?: Array<{ thumburl?: string; url?: string }> };
        const imgUrl = fileInfo?.imageinfo?.[0]?.thumburl ?? fileInfo?.imageinfo?.[0]?.url;
        if (imgUrl) setSrc(imgUrl);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [title, size]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[#0f0f0f] text-3xl ${className}`}>
        {fallback}
      </div>
    );
  }

  if (!src) {
    return <div className={`animate-pulse bg-[#181818] ${className}`} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? title}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
