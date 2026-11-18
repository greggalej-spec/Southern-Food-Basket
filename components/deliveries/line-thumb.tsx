import { Icon } from "@/components/icon";
import { Pic } from "@/components/pic";
import { itemOfLine, photoOf } from "@/lib/ops/delivery-catalogue";

/** The small picture beside a line of an order: the catalogue item's photograph, or a plain tag tile for a line the
 *  customer typed themselves. Decorative: the line's name is always written next to it. Styles: styles/site.css. */
export function LineThumb({ line }: { line: { sku?: string; item: string } }) {
  const it = itemOfLine(line);
  if (it) return <Pic src={photoOf(it.id)} alt="" ar="1 / 1" className="dv-thumb" />;
  return (
    <span className="dv-thumb dv-thumb-own" aria-hidden="true">
      <Icon name="tag" />
    </span>
  );
}
