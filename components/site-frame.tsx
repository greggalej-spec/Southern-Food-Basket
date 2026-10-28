import { ConceptBanner } from "@/components/concept-banner";
import { Scope, type CssName } from "@/components/scope";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type SiteNavId } from "@/components/site-header";

/** A public page: the old <header data-sfb-header>, <main id="main">, <footer data-sfb-footer>, and the demo banner
 *  on pages that had data-banner. css names the stylesheets the page loaded. */
export function SiteFrame({
  active,
  css = ["site"],
  page,
  banner = false,
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
      {banner && <ConceptBanner />}
      <SiteHeader active={active} />
      <main id="main">{children}</main>
      <SiteFooter />
    </Scope>
  );
}
