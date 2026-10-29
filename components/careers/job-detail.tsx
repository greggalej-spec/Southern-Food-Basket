"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MetaItem } from "@/components/careers/parts";
import { Icon } from "@/components/icon";
import { branchName } from "@/lib/careers/helpers";
import { fmtDate } from "@/lib/format";
import { DOC_PLAIN } from "@/lib/hr/plain";
import { byId, useData, useHydrated } from "@/lib/store";

// Ported from careers.js renderJob (careers/job.html?id=). Prerendered from the seed; once live it follows this
// browser's data, so a role HR closed or added here shows as the static page showed it, title included.

export function JobDetail({ id }: { id: string }) {
  const d = useData();
  const hydrated = useHydrated();
  const job = byId(d.jobs, id);
  const open = !!job && job.status === "open";
  const title = open ? job.title + " · Careers · Southern Food Basket" : "Role not found · Careers · Southern Food Basket";
  useEffect(() => {
    if (hydrated) document.title = title;
  }, [hydrated, title]);

  if (!job || !open) {
    return (
      <div className="empty">
        <h2 style={{ fontSize: "1.5rem" }}>{job ? "This role is no longer open" : "We could not find that role"}</h2>
        <p style={{ marginInline: "auto" }}>
          {(job ? "Applications for " + job.title + " at " + branchName(d, job.branchId) + " have closed." : "The link may be out of date.") +
            " The roles we are hiring for now are listed on the careers page."}
        </p>
        <Link className="btn btn-sign" href="/careers">
          See open roles
        </Link>
      </div>
    );
  }

  const branch = branchName(d, job.branchId);
  const needs = (job.kyc || []).map((k) => byId(d.kycDocs, k)).filter((doc) => doc !== null);
  return (
    <>
      <Link className="back-link" href="/careers">
        <Icon name="arrow" />
        {" Back to roles"}
      </Link>
      <div className="job-head">
        <p className="eyebrow">{job.dept + " · " + branch}</p>
        <h1>{job.title}</h1>
        <ul className="role-meta">
          <MetaItem icon="pin" text={branch} />
          <MetaItem icon="briefcase" text={job.type} />
          <MetaItem icon="clock" text={job.shift} />
        </ul>
      </div>
      <div className="job-layout">
        <div className="job-body">
          <h2>The role</h2>
          <p>{job.summary}</p>
          <h2>What you will do</h2>
          <ul>
            {(job.responsibilities || []).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <h2>What we are looking for</h2>
          <ul>
            {(job.requirements || []).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <h2>How hiring works</h2>
          <p>
            Apply online in five short steps. HR reads your application, checks your documents and may invite you to a short interview at the
            store. Whichever way it goes, you get a written decision on your applicant page, where every step and how long it usually takes is
            shown.
          </p>
        </div>
        <aside className="job-aside" aria-label="Role summary">
          <div className="card">
            <dl className="kv">
              <dt>Branch</dt>
              <dd>{branch}</dd>
              <dt>Type</dt>
              <dd>{job.type}</dd>
              <dt>Shift</dt>
              <dd>{job.shift}</dd>
              <dt>Pay</dt>
              <dd>Discussed after your interview</dd>
              <dt>Posted</dt>
              <dd>{fmtDate(job.posted)}</dd>
            </dl>
            <Link className="btn btn-sign" href={"/careers/" + encodeURIComponent(job.id) + "/apply"}>
              Apply for this role
            </Link>
            <Link className="btn btn-ghost" href="/careers">
              Back to roles
            </Link>
          </div>
          <div className="card">
            <h3 style={{ fontSize: "1.125rem" }}>Documents you will need</h3>
            <p className="small muted">You can apply first and add any you do not have yet from your dashboard.</p>
            <ul className="need-list">
              {needs.map((doc) => (
                <li key={doc.id}>
                  <Icon name={doc.conditional ? "file" : "check"} />
                  <div>
                    <strong>{doc.name}</strong>
                    <span className="muted">{DOC_PLAIN[doc.id] || doc.desc}</span>
                    {doc.conditional && <span className="badge badge-plain">Only if it applies to you</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
