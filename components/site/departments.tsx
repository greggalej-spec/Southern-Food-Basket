"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { Pic } from "@/components/pic";
import { fmtDate, money } from "@/lib/format";
import { dealsIn, dollars, newestFirst } from "@/lib/site/deals";
import { useJumpToHash } from "@/lib/site/jump-to-hash";
import { useData } from "@/lib/store";

// site.js departments(): the jump chips and one section per department with its recent specials, from this browser's
// copy of the data (the seed until hydration).

export function DeptJumps() {
  return useData().departments.map((x) => (
    <li key={x.id}>
      <a className="chip" href={"#" + x.id}>
        {x.short}
      </a>
    </li>
  ));
}

export function DeptSections() {
  const d = useData();
  useJumpToHash();
  return d.departments.map((x, i) => {
    const deals = newestFirst(dealsIn(d, x.id));
    return (
      <section className="dept-section" id={x.id} aria-labelledby={x.id + "-title"} key={x.id}>
        <div className="container">
          <div className={"split split-top" + (i % 2 ? " reverse" : "")}>
            <Pic src={x.img} alt={x.alt || x.name} />
            <div>
              <p className="eyebrow">Department</p>
              <h2 id={x.id + "-title"}>{x.name}</h2>
              <p className="lede">{x.blurb}</p>
              {deals.length ? (
                <>
                  <h3>Recent specials</h3>
                  <ul className="deal-rows">
                    {deals.map((sp) => (
                      <li key={sp.id}>
                        <span className="name">{sp.name}</span>
                        <span className="when">{"Posted " + fmtDate(sp.posted) + (sp.couva ? " · Couva" : "")}</span>
                        <span className="amt" aria-label={money(sp.price)}>
                          {dollars(sp.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p style={{ marginTop: 16 }}>
                    <Link className="more-link" href={"/specials?dept=" + encodeURIComponent(x.id)}>
                      See these deals with photos <Icon name="arrow" />
                    </Link>
                  </p>
                </>
              ) : x.id === "wholesale" ? (
                <p>
                  <Link className="btn btn-primary" href="/wholesale">
                    Wholesale and trade accounts
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  });
}
