"use client";

import Link from "next/link";
import { Flow } from "@/components/viz";
import { DEPTS, FLOWS } from "@/lib/flows";

/* "How it all flows": every process in the system as a moving diagram, grouped by department. It is the same
   script the guides at the top of each console section use (lib/flows.ts), shown together for someone deciding
   whether the whole thing is worth having. */

const INTRO: Record<(typeof DEPTS)[number], string> = {
  Administration: "The office’s paperwork: what suppliers send, what the community asks for, and what the stores order together.",
  Marketing: "The social accounts, the website’s figures and the plan for what goes out next.",
  Website: "Changes the team can make to the public site without a developer.",
  HR: "From the job advert to the first day, and the whole team’s files after that.",
  "Owner’s office": "Everything above, on one page, with the decisions only the owner can make at the top.",
  Everyone: "How people get in, and why each sees only their own part.",
};

const slug = (d: string) => d.toLowerCase().replace(/[^a-z]+/g, "-");

export function FlowsPage() {
  return (
    <div className="flows-page">
      <ul className="dept-map" aria-label="Departments">
        {DEPTS.map((d) => (
          <li key={d}>
            <a href={"#" + slug(d)}>
              <strong>{d}</strong>
              <span>{FLOWS.filter((f) => f.dept === d).length === 1 ? "1 flow" : FLOWS.filter((f) => f.dept === d).length + " flows"}</span>
            </a>
          </li>
        ))}
      </ul>
      {DEPTS.map((d) => (
        <section className="flows-dept" key={d} id={slug(d)} aria-labelledby={slug(d) + "-h"}>
          <h2 id={slug(d) + "-h"}>{d}</h2>
          <p className="muted">{INTRO[d]}</p>
          <div className="flows-list">
            {FLOWS.filter((f) => f.dept === d).map((f) => (
              <div key={f.id}>
                <Flow def={f} always />
                <p className="flow-cta small">
                  {f.summary}{" "}
                  <Link href={f.href}>Open it</Link>
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
