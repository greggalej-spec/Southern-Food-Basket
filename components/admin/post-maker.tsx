"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { canon, newestFirst } from "@/lib/admin/helpers";
import { captionFor, drawPost, focusText, type DrawResult, type PostStatus } from "@/lib/admin/post";
import { money } from "@/lib/format";
import { byId, useData } from "@/lib/store";

// The Post maker tab from admin.js (section 2): pick a deal, draw it in the store's Instagram format on the
// canvas, download the PNG and copy the caption. The drawing itself is lib/admin/post.ts.

export function PostMaker({
  active,
  showTick,
  choice,
  onChoose,
}: {
  active: boolean;
  showTick: number;
  choice: string | null;
  onChoose: (id: string) => void;
}) {
  const d = useData();
  /* until the user picks a deal, the post maker follows the newest one (so a deal just added is ready to post) */
  const list = newestFirst(d.specials || []);
  const selectedId = choice && list.some((x) => x.id === choice) ? choice : list[0]?.id || "";
  const sp = byId(d.specials, selectedId);

  const [headline, setHeadline] = useState(false);
  const [focus, setFocus] = useState(50);
  const [valueText, setValueText] = useState(false);
  const [caption, setCaption] = useState("");
  const [captionKey, setCaptionKey] = useState("");
  const [status, setStatus] = useState<PostStatus>({ msg: "", bad: false });
  const [download, setDownload] = useState<DrawResult["download"]>(null);
  const [dlName, setDlName] = useState("sfb-post.png");
  const [label, setLabel] = useState("Preview of the Instagram post");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const delay = useRef(0);
  const drawSeq = useRef(0);

  /* whenever the Post maker tab is shown: refresh the caption if the deal (or its details) changed */
  const key = sp ? canon(sp) : "";
  if (active && key !== captionKey) {
    setCaptionKey(key);
    setCaption(sp ? captionFor(sp) : "");
    setFocus(50);
    setValueText(true);
  }

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const seq = ++drawSeq.current;
    let live = true;
    const isCurrent = () => live && seq === drawSeq.current;
    const timer = setTimeout(() => {
      if (sp) {
        setStatus((s) => (!s.msg || s.bad ? { msg: "Drawing the post…", bad: false } : s));
        setDownload(null);
      }
      drawPost(canvas, sp, { headline, focus }, isCurrent).then((res) => {
        if (!res || !isCurrent()) return;
        setLabel(res.label);
        setStatus(res.status);
        setDownload(res.download);
        if (res.download) setDlName(res.download.name);
      });
    }, delay.current);
    delay.current = 0;
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [active, sp, headline, focus, showTick]);

  async function copy() {
    const text = caption;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        const ta = captionRef.current;
        if (ta) {
          ta.focus();
          ta.select();
          ok = document.execCommand("copy");
        }
      } catch {
        ok = false;
      }
      copyRef.current?.focus();
    }
    toast(ok ? "Caption copied. Paste it under the post on Instagram." : "Copy did not work here. Select the caption text and copy it yourself.", ok ? "ok" : "bad");
  }

  return (
    <div className="post-grid">
      <div className="post-controls">
        <div className="field">
          <label htmlFor="post-deal">Deal</label>
          <select id="post-deal" value={selectedId} disabled={!list.length} onChange={(e) => onChoose(e.target.value)}>
            {list.length ? (
              list.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name + " · " + money(x.price)}
                </option>
              ))
            ) : (
              <option value="">No deals yet. Add one under Specials.</option>
            )}
          </select>
        </div>
        <div className="field">
          <label className="check" htmlFor="post-headline">
            <input type="checkbox" id="post-headline" checked={headline} onChange={(e) => setHeadline(e.target.checked)} />
            <span>Show the product name as a headline</span>
          </label>
        </div>
        <div className="field">
          <label htmlFor="post-focus">Photo position</label>
          <input
            type="range"
            id="post-focus"
            min="0"
            max="100"
            step="1"
            value={focus}
            onChange={(e) => {
              delay.current = 120;
              setFocus(Number(e.target.value));
              setValueText(true);
            }}
            aria-describedby="post-focus-hint"
            aria-valuetext={valueText ? focusText(focus) : undefined}
          />
          <p className="hint" id="post-focus-hint">
            The photo is cropped to fit the tall post. Slide left or right to choose which part shows.
          </p>
        </div>
        {/* React only touches the live region when the message changes, so dragging the slider is not read out */}
        <p className={status.bad ? "small muted is-bad" : "small muted"} id="post-status" role="status">
          {status.msg}
        </p>
        <div className="cluster">
          <a
            className="btn btn-primary"
            id="post-download"
            href={download ? download.url : "#"}
            download={dlName}
            aria-disabled={download ? undefined : "true"}
            onClick={(e) => {
              if (download) return;
              e.preventDefault();
              toast(status.bad ? status.msg : "The post is still being drawn. Try again in a moment.", "bad");
            }}
          >
            Download PNG
          </a>
        </div>
        <p className="hint">This makes the same post format the store already uses on Instagram.</p>
        <div className="field caption-field">
          <label htmlFor="post-caption">Caption</label>
          <textarea id="post-caption" rows={5} ref={captionRef} value={caption} onChange={(e) => setCaption(e.target.value)} />
          <div className="cluster caption-actions">
            <button className="btn btn-ghost btn-sm" type="button" id="post-copy" ref={copyRef} onClick={copy}>
              Copy caption
            </button>
          </div>
        </div>
      </div>
      <figure className="post-figure">
        <canvas id="post-canvas" className="post-canvas" width={1080} height={1350} role="img" aria-label={label} ref={canvasRef} />
        <figcaption className="small muted">Preview, scaled to fit. The download is full size.</figcaption>
      </figure>
    </div>
  );
}
