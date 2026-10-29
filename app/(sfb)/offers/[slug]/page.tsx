import type { Metadata } from "next";
import { Suspense } from "react";
import { OfferDetail } from "@/components/members/offers";
import { SiteFrame } from "@/components/site-frame";
import { SEED } from "@/lib/seed";

// One members' offer and its code panel. The slug is read inside Suspense so the header and footer stay in the shell.
// There is no server-side 404: offers drafted in the office console live in the browser, not in the seed, so the
// page decides on the client and shows its own "not found" (components/members/offers.tsx).

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SEED.promotions.filter((p) => p.status === "approved").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = SEED.promotions.find((x) => x.slug === slug && x.status === "approved");
  return { title: p ? p.benefit + " · Members’ offers" : "Members’ offer" };
}

async function OfferFromParams({ params }: Props) {
  const { slug } = await params;
  return <OfferDetail slug={slug} />;
}

export default function OfferPage({ params }: Props) {
  return (
    <SiteFrame active="offers" css={["site", "members"]} page="offer" banner>
      <Suspense fallback={<div className="offer-wait" aria-busy="true" />}>
        <OfferFromParams params={params} />
      </Suspense>
    </SiteFrame>
  );
}
