import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplyView } from "@/components/careers/apply-form";
import { SiteFrame } from "@/components/site-frame";
import { SEED } from "@/lib/seed";

// Ported from careers/apply.html?id=; the form comes from careers.js renderApply. The id is read inside Suspense so
// the header and footer stay in the shell every link to this route shares.

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return SEED.jobs.map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = SEED.jobs.find((j) => j.id === id);
  return { title: job && job.status === "open" ? "Apply: " + job.title : "Apply · Careers" };
}

async function ApplyFromParams({ params }: Props) {
  const { id } = await params;
  return <ApplyView id={id} />;
}

export default function ApplyPage({ params }: Props) {
  return (
    <SiteFrame active="careers" css={["app", "careers"]} page="apply" banner>
      <div className="container section apply-wrap">
        <div id="apply-root">
          <Suspense fallback={null}>
            <ApplyFromParams params={params} />
          </Suspense>
        </div>
      </div>
    </SiteFrame>
  );
}
