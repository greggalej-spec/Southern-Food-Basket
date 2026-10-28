"use client";

import { Fragment, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import { acceptAttr } from "@/lib/careers/helpers";
import { fileSize, fmtDate } from "@/lib/format";
import type { KycDoc } from "@/lib/types";

// Ported from careers.js metaItem, thumbHtml, fileMetaHtml, uploadBtnHtml and the in-memory preview map.

type FileMetaLike = { fileName?: string; size?: number; expiry?: string } | null | undefined;

export function MetaItem({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li>
      <Icon name={icon} />
      <span>{text}</span>
    </li>
  );
}

export function Thumb({ meta, preview }: { meta: FileMetaLike; preview?: string }) {
  if (!meta || !meta.fileName) return null;
  if (preview) return <img className="doc-preview" src={preview} alt={"Preview of " + meta.fileName} />;
  return (
    <span className="doc-ph" aria-hidden="true">
      <Icon name="file" />
    </span>
  );
}

export function FileMeta({ meta }: { meta: FileMetaLike }) {
  if (!meta || !meta.fileName) return null;
  const bits = [meta.fileName];
  if (meta.size != null) bits.push(fileSize(meta.size));
  if (meta.expiry) bits.push("Expires " + fmtDate(meta.expiry));
  return (
    <div className="doc-file">
      {bits.map((b, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">·</span>}
          <span>{b}</span>
        </Fragment>
      ))}
    </div>
  );
}

export function UploadButton({ doc, label, onFile }: { doc: KycDoc; label: string; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="btn btn-ghost btn-sm file-btn">
      <Icon name="upload" />
      <span>{label}</span>
      <input type="file" accept={acceptAttr(doc.formats)} data-doc-file={doc.id} aria-label={label + " " + doc.name} onChange={onFile} />
    </label>
  );
}

/** docId → object URL for image previews. In memory only, never stored. */
export function usePreviews() {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  function setPreview(docId: string, file: File | null) {
    const next = { ...previews };
    if (next[docId]) {
      try {
        URL.revokeObjectURL(next[docId]);
      } catch {}
      delete next[docId];
    }
    if (file && /^image\//.test(file.type)) next[docId] = URL.createObjectURL(file);
    setPreviews(next);
  }
  function clearPreviews() {
    Object.values(previews).forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    setPreviews({});
  }
  return { previews, setPreview, clearPreviews };
}
