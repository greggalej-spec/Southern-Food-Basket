import type { Metadata } from "next";
import { Suspense } from "react";
import { JobDetail } from "@/components/careers/job-detail";
import { SiteFrame } from "@/components/site-frame";
import { SEED } from "@/lib/seed";

// Ported from careers/job.html?id=; the role itself comes from careers.js renderJob. The id is read inside Suspense
// so the header and footer stay in the shell every link to this route shares.

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return SEED.jobs.map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = SEED.jobs.find((j) => j.id === id);
  return { title: job && job.status === "open" ? job.title + " · Careers" : "Role not found · Careers" };
}

async function JobFromParams({ params }: Props) {
  const { id } = await params;
  return <JobDetail id={id} />;
}

export default function JobPage({ params }: Props) {
  return (
    <SiteFrame active="careers" css={["careers"]} page="job" banner>
      <div className="container section" id="job-main">
        <Suspense fallback={null}>
          <JobFromParams params={params} />
        </Suspense>
      </div>
    </SiteFrame>
  );
}
