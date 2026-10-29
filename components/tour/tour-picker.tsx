"use client";

import { useState } from "react";
import { CHAPTERS } from "@/lib/tour-chapters";
import { startTour } from "@/lib/tour";
import { reset } from "@/lib/store";

/* The chapter list on /tour. Starting a chapter can first put the demo back as it began (the default), so the
   people, codes and offers the steps talk about are where the script expects them. */

export function TourPicker() {
  const [fresh, setFresh] = useState(true);

  function start(id: string) {
    if (fresh) reset();
    startTour(id);
  }

  return (
    <>
      <div className="tour-start">
        <button className="btn btn-primary" type="button" onClick={() => start(CHAPTERS[0].id)}>
          Start the tour
        </button>
        <label className="check">
          <input type="checkbox" checked={fresh} onChange={(e) => setFresh(e.target.checked)} />
          <span>Reset the demo first, so it starts as the tour expects</span>
        </label>
      </div>
      <ol className="tour-chapters">
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            <h2>{c.title}</h2>
            <p>{c.summary}</p>
            <p className="tour-meta">
              {c.cast} · {c.steps.length} steps
            </p>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => start(c.id)} aria-label={"Start the chapter: " + c.title}>
              Start here
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}
