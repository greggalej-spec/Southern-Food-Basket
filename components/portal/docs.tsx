"use client";

import { useEffect, useRef, useState } from "react";
import { DocBadge } from "@/components/badges";
import { Icon } from "@/components/icon";
import { EmptyRow, PortalPage } from "@/components/portal/portal-page";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { type DocDisplayState, daysUntil, docDisplayState, fileSize, fmtDate } from "@/lib/format";
import { fmtDay, fmtMinutes, inDays, plural, todayIso } from "@/lib/portal/format";
import { byId, setEmployeeDoc, setTrainingDone } from "@/lib/store";
import type { Employee, KycDoc, Seed, Training } from "@/lib/types";

// Training, my documents and policies (portal/docs.html, renderDocs in portal.js). Files never leave the tab: only
// their metadata is stored, and an image's preview is an object URL held by this page.

const MAX_UPLOAD = 8 * 1024 * 1024; /* 8 MB */
const UPLOADABLE: Partial<Record<DocDisplayState, true>> = { missing: true, expired: true, expiring: true, flagged: true };

function fmtFormats(list: string[]) {
  const f = (list || []).map((x) => x.toUpperCase());
  return f.length > 1 ? f.slice(0, -1).join(", ") + " or " + f[f.length - 1] : f.join("");
}

function TrainingRow({ t, onToggle }: { t: Training; onToggle: (t: Training, done: boolean) => void }) {
  let badge = <Badge>To do</Badge>, meta = fmtMinutes(t.minutes);
  if (t.done) {
    badge = <Badge variant="ok">Completed</Badge>;
    if (t.completedAt) meta += " · completed " + fmtDay(t.completedAt);
  } else if (t.due) {
    const n = daysUntil(t.due), m = n ?? 0;
    meta += " · due " + fmtDay(t.due);
    if (m < 0) badge = <Badge variant="bad">Overdue</Badge>;
    else if (m <= 30) badge = <Badge variant="warn">{"Due " + inDays(n)}</Badge>;
  }
  return (
    <li>
      <div className="grow">
        <strong>{t.name}</strong>
        <div className="meta">{meta}</div>
      </div>
      <div className="actions">
        {badge}
        <button className={"btn btn-sm " + (t.done ? "btn-ghost" : "btn-primary")} type="button" data-training={t.id} data-done={t.done ? "0" : "1"} onClick={() => onToggle(t, !t.done)}>
          {t.done ? "Undo" : "Mark complete"}
        </button>
      </div>
    </li>
  );
}

/** uploadControl() plus the checks its change handler ran: format, size, then the new expiry date if the document has one. */
function UploadControl({ doc, st, onUpload }: { doc: KycDoc; st: DocDisplayState; onUpload: (doc: KycDoc, file: File, expiry?: string) => void }) {
  const expRef = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);
  const id = "exp-" + doc.id, accept = (doc.formats || []).map((f) => "." + f).join(",");
  const verb = st === "missing" ? "Upload" : st === "flagged" ? "Replace" : "Upload renewal";

  function change(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const okExt = (doc.formats || []).some((f) => f === ext || (f === "jpg" && ext === "jpeg"));
    const okType = !file.type || /^(application\/pdf|image\/(jpeg|png))$/.test(file.type);
    if (!okExt || !okType) {
      toast("That file type is not accepted. Use " + fmtFormats(doc.formats) + ".", "bad");
      input.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD) {
      toast("That file is " + fileSize(file.size) + ". The limit is 8 MB.", "bad");
      input.value = "";
      return;
    }
    const exp = expRef.current;
    if (exp) {
      setInvalid(false);
      if (!exp.value || exp.value <= todayIso()) {
        toast(!exp.value ? "Enter the new expiry date first." : "The new expiry date must be after today.", "bad");
        setInvalid(true);
        exp.focus();
        input.value = "";
        return;
      }
    }
    onUpload(doc, file, exp ? exp.value : undefined);
  }

  return (
    <form className="doc-upload-form" data-doc={doc.id} onSubmit={(e) => e.preventDefault()}>
      {doc.expires ? (
        <div className="field">
          <label htmlFor={id}>New expiry date</label>
          <input ref={expRef} type="date" id={id} name="expiry" min={todayIso()} required aria-invalid={invalid ? true : undefined} />
        </div>
      ) : null}
      <label className="btn btn-ghost btn-sm doc-upload">
        <Icon name="upload" /> {verb}
        <input type="file" className="visually-hidden" name="file" accept={accept} data-doc={doc.id} onChange={change} />
      </label>
    </form>
  );
}

function DocsBody({ me, d }: { me: Employee; d: Seed }) {
  // docId -> the image preview's object URL; `live` mirrors it for revoking when the page goes away.
  const [previews, setPreviews] = useState<Record<string, { url: string; name: string }>>({});
  const live = useRef<Record<string, string>>({});
  // portal.js repainted every row after an upload, which cleared the other rows' half-filled expiry dates; bumping
  // this key does the same.
  const [paint, setPaint] = useState(0);

  useEffect(() => {
    const urls = live.current;
    return () => Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function toggleTraining(t: Training, done: boolean) {
    setTrainingDone(me.id, t.id, done);
    toast((done ? "Marked complete: " : "Marked as not done: ") + t.name, "ok");
  }

  function upload(doc: KycDoc, file: File, expiry?: string) {
    const docId = doc.id;
    if (live.current[docId]) {
      URL.revokeObjectURL(live.current[docId]);
      delete live.current[docId];
    }
    const pv = /^image\//.test(file.type) ? { url: URL.createObjectURL(file), name: file.name } : null;
    if (pv) live.current[docId] = pv.url;
    setPreviews((cur) => {
      const next = { ...cur };
      delete next[docId];
      if (pv) next[docId] = pv;
      return next;
    });
    const extra: { fileName: string; size: number; type: string; expiry?: string } = { fileName: file.name, size: file.size, type: file.type || "application/octet-stream" };
    if (expiry !== undefined) extra.expiry = expiry;
    setEmployeeDoc(me.id, docId, "uploaded", extra); /* metadata only; the file itself stays in this tab */
    toast(doc.name + " uploaded. HR will review it.", "ok");
    setPaint((n) => n + 1);
  }

  const items = (me.training || []).slice();
  const todo = items.filter((t) => !t.done).length;
  const comp = me.compliance || [];
  const policies = d.policies || [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Documents &amp; training</h1>
          <p className="muted">Training to complete, the documents we hold for you, and company policies.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="stack stack-lg">
          <section className="panel" id="training" aria-labelledby="h-tr">
            <div className="panel-head">
              <h2 id="h-tr">Training</h2>
              <Badge variant={todo ? "warn" : "ok"} id="tr-count">
                {todo ? plural(todo, "course") + " to do" : "All done"}
              </Badge>
            </div>
            <ul className="list list-actions" id="training-list">
              {items.length ? items.map((t) => <TrainingRow key={t.id} t={t} onToggle={toggleTraining} />) : <EmptyRow text="No training assigned." />}
            </ul>
          </section>
          <section className="panel" id="documents" aria-labelledby="h-docs">
            <div className="panel-head">
              <h2 id="h-docs">My documents</h2>
            </div>
            <div id="doc-list">
              {comp.length ? (
                comp.map((c) => {
                  const doc: KycDoc = byId(d.kycDocs, c.docId) || { id: c.docId, name: c.docId, desc: "", formats: ["pdf", "jpg", "png"], expires: !!c.expiry };
                  const st = docDisplayState(c), bits: string[] = [];
                  if (c.fileName) bits.push(c.fileName + (c.size ? " · " + fileSize(c.size) : ""));
                  if (c.expiry) {
                    const n = daysUntil(c.expiry);
                    bits.push((n != null && n < 0 ? "Expired " : "Expires ") + fmtDay(c.expiry) + " (" + inDays(n) + ")");
                  }
                  if (c.updatedAt) bits.push("Updated " + fmtDate(c.updatedAt));
                  const pv = previews[c.docId];
                  return (
                    <div className="doc-row" key={c.docId}>
                      <div className="doc-with-preview">
                        {pv ? <img className="doc-preview" src={pv.url} alt={"Preview of " + pv.name} /> : null}
                        <div>
                          <div className="doc-name">{doc.name}</div>
                          <div className="doc-desc">{doc.desc}</div>
                          {bits.length ? (
                            <div className="doc-file">
                              {bits.map((b, i) => (
                                <span key={i}>{b}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <DocBadge state={st} />
                      </div>
                      <div className="doc-actions">{UPLOADABLE[st] ? <UploadControl key={paint} doc={doc} st={st} onUpload={upload} /> : null}</div>
                      {st === "flagged" && c.reason ? <div className="doc-reason">{c.reason}</div> : null}
                    </div>
                  );
                })
              ) : (
                <div className="empty">No documents on file.</div>
              )}
            </div>
            <div className="hint-row">
              <p className="hint">Files never leave this browser. Only the file name, size, type and expiry date are kept, in this browser’s storage, until the demo is reset.</p>
            </div>
          </section>
        </div>
        <section className="panel" id="policies" aria-labelledby="h-pol">
          <div className="panel-head">
            <h2 id="h-pol">Policies</h2>
          </div>
          <ul className="list list-actions" id="policy-list">
            {policies.length ? (
              policies.map((p) => (
                <li key={p.id}>
                  <div className="grow">
                    <strong>{p.title}</strong>
                    <div className="meta">{"Updated " + fmtDay(p.updated)}</div>
                    <p className="small ann-body">{p.summary}</p>
                  </div>
                  <div className="actions">
                    <button className="btn btn-ghost btn-sm" type="button" aria-disabled="true" data-policy={p.id} onClick={() => toast("Demo: policy documents are not included.")}>
                      Open
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <EmptyRow text="No policies published." />
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

export function PortalDocs() {
  return (
    <PortalPage active="docs" title="Documents & training" page="docs">
      {(me, d) => <DocsBody me={me} d={d} />}
    </PortalPage>
  );
}
