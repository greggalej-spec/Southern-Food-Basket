"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import "@/styles/skeleton.css";

/** Picture tile that shows the ribbon pattern instead of a broken image, and a skeleton while it loads. */
export function Pic({ src, alt = "", className, ar }: { src: string; alt?: string; className?: string; ar?: string }) {
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  // An image that failed or loaded before hydration never fires onError or onLoad, so check it once it is in the
  // DOM. Only one still on its way gets the skeleton (styles/skeleton.css).
  const check = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    if (img.complete && img.naturalWidth === 0) setMissing(true);
    else if (!img.complete) setLoading(true);
  }, []);
  return (
    <figure className={cn("pic", className, missing && "is-missing", loading && !missing && "is-loading")} style={ar ? ({ "--ar": ar } as React.CSSProperties) : undefined}>
      <img
        ref={check}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoading(false)}
        onError={() => {
          setMissing(true);
          setLoading(false);
        }}
      />
    </figure>
  );
}
