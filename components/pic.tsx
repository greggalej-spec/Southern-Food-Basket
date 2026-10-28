"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

/** Picture tile that shows the ribbon pattern instead of a broken image. */
export function Pic({ src, alt = "", className, ar }: { src: string; alt?: string; className?: string; ar?: string }) {
  const [missing, setMissing] = useState(false);
  // An image that failed before hydration never fires onError, so check it once it is in the DOM.
  const check = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  return (
    <figure className={cn("pic", className, missing && "is-missing")} style={ar ? ({ "--ar": ar } as React.CSSProperties) : undefined}>
      <img ref={check} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setMissing(true)} />
    </figure>
  );
}
