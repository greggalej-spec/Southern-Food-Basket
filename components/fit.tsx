import "@/styles/storefront.css";
import type { CSSProperties } from "react";

/** A picture shown whole, whatever its shape: it sits uncropped in its frame over a blurred copy of itself
 *  (styles/storefront.css `.fit`). The frame's size comes from the class it is given. */
export function Fit({ src, alt = "", className = "", eager = false, as: Tag = "span" }: { src: string; alt?: string; className?: string; eager?: boolean; as?: "span" | "div" | "figure" }) {
  const style = { "--fit-img": 'url("' + src.replace(/"/g, "%22") + '")' } as CSSProperties;
  return (
    <Tag className={"fit" + (className ? " " + className : "")} style={style}>
      <img src={src} alt={alt} loading={eager ? undefined : "lazy"} decoding="async" />
    </Tag>
  );
}
