"use client";
import React from "react";
import { Skeleton } from "./Skeleton.js";

interface GalleryImage {
  url: string;
  alt?: string | undefined;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [heroLoaded, setHeroLoaded] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [thumbLoaded, setThumbLoaded] = React.useState<Record<number, boolean>>({});

  const hero = images[activeIndex] ?? images[0];
  const thumbs = images.slice(0, 5);

  return (
    <div className={className}>
      {/* Hero */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--color-surface-2)",
        }}
      >
        {!heroLoaded && (
          <Skeleton
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 0 }}
          />
        )}
        {hero && (
          <img
            key={hero.url}
            src={`${process.env.NEXT_PUBLIC_AZURE_CDN_ENDPOINT ?? ""}${hero.url}`}
            alt={hero.alt ?? ""}
            onLoad={() => setHeroLoaded(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: heroLoaded ? 1 : 0,
              transition: "opacity 150ms ease",
            }}
          />
        )}
      </div>

      {/* Thumbnails */}
      {thumbs.length > 1 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(thumbs.length, 4)}, 1fr)`,
            gap: 8,
            marginTop: 8,
          }}
        >
          {thumbs.map((img, i) => (
            <button
              key={img.url}
              onClick={() => { setActiveIndex(i); setHeroLoaded(false); }}
              style={{
                position: "relative",
                paddingTop: "100%",
                border: activeIndex === i
                  ? "1.5px solid var(--color-accent)"
                  : "0.5px solid var(--color-hairline)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                background: "var(--color-surface-2)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {!thumbLoaded[i] && (
                <Skeleton style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 0 }} />
              )}
              <img
                src={`${process.env.NEXT_PUBLIC_AZURE_CDN_ENDPOINT ?? ""}${img.url}`}
                alt={img.alt ?? ""}
                onLoad={() => setThumbLoaded((prev) => ({ ...prev, [i]: true }))}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: thumbLoaded[i] ? 1 : 0,
                  transition: "opacity 150ms ease",
                }}
              />
              {/* Overlay for non-active */}
              {activeIndex !== i && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(52,48,42,0.12)" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
