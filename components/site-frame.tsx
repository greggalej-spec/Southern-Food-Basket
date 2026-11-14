import { Scope, type CssName } from "@/components/scope";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type SiteNavId } from "@/components/site-header";

/** A public page: the old <header data-sfb-header>, <main id="main">, <footer data-sfb-footer>. css names the
 *  stylesheets the page loaded. The "Prototype" notice that some pages showed (banner) is off (Gregg, 14 Nov 2026:
 *  "remove the prototype notice"); the prop is still accepted so those pages need no change. */
export function SiteFrame({
  active,
  css = ["site"],
  page,
  children,
}: {
  active?: SiteNavId;
  css?: CssName[];
  page?: string;
  banner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Scope css={css} page={page}>
      <SiteHeader active={active} />
      <main id="main">{children}</main>
      <SiteFooter />
    </Scope>
  );
}
