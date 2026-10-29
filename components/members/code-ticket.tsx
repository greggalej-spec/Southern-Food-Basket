import { Badge } from "@/components/ui/badge";
import type { WalletItem } from "@/lib/account";
import { CODE_ALPHABET, fmtTT, normalizeCode, storesLabel } from "@/lib/promo";
import { byId } from "@/lib/store";
import type { Seed } from "@/lib/types";

// A shopper's code, shown like a ticket in a wallet: what it is for, where and until when, then the code itself, big
// enough to read across a till. The code is set in the UI face (Atkinson Hyperlegible Next, built so 0/O and 1/I/l
// differ) with tabular figures, not in a monospace. Screen readers get it spelled out, one character at a time.

export type TicketStatus = "ready" | "used" | "ended" | "cancelled";

const STATUS: Record<TicketStatus, { label: string; variant: "ok" | "neutral" | "bad" }> = {
  ready: { label: "Ready to use", variant: "ok" },
  used: { label: "Used", variant: "neutral" },
  ended: { label: "Offer ended", variant: "neutral" },
  cancelled: { label: "Cancelled", variant: "bad" },
};

/** "K7QM-4XDP" read as "K, 7, Q, M, dash, 4, X, D, P". */
export function spelledCode(code: string) {
  return [...code].map((c) => (c === "-" ? "dash" : c)).join(", ");
}

/** Decoration only: stripes drawn from the code's characters (five per character, thin or thick by the bits of its
 *  place in CODE_ALPHABET), so each code looks like its own. It is not a barcode and no scanner reads it. */
export function CodePattern({ code }: { code: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const bar = (w: number, gap: number) => {
    bars.push({ x, w });
    x += w + gap;
  };
  bar(2, 2);
  bar(2, 4);
  for (const ch of normalizeCode(code)) {
    const n = Math.max(0, CODE_ALPHABET.indexOf(ch));
    for (let b = 4; b >= 0; b--) bar((n >> b) & 1 ? 4 : 2, (n + b) % 3 === 0 ? 4 : 2);
  }
  bar(2, 2);
  bar(2, 0);
  return (
    <svg className="code-pattern" viewBox={"0 0 " + x + " 36"} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="36" />
      ))}
    </svg>
  );
}

type TicketProps = {
  code: string;
  title: string;
  benefit: string;
  where: string;
  status: TicketStatus;
  /** One line under the code: when it was used, why it stopped working. Defaults to how to use it. */
  note?: string;
  tour?: string;
  ref?: React.Ref<HTMLElement>;
};

/** How a code in the wallet stands now. Reads the clock: call it after hydration. */
export function ticketFor(d: Seed, it: WalletItem, now: Date): Omit<TicketProps, "tour" | "ref"> {
  const p = it.promo;
  const e = it.entitlement;
  const base = {
    code: it.code,
    title: p?.title || "Members’ offer",
    benefit: p?.benefit || "An offer we have taken down",
    where: p ? storesLabel(d, p.branchIds) + " · until " + fmtTT(p.ends) : "",
  };
  if (!e || e.status === "void") return { ...base, status: "cancelled", note: "This code was cancelled. It does not work at the till." };
  if (e.status === "redeemed") {
    const store = byId(d.branches, e.redeemedBranch)?.name || "one of our stores";
    return { ...base, status: "used", note: "Used on " + fmtTT(e.redeemedAt || e.claimedAt) + " at " + store + "." };
  }
  if (!p || now.getTime() > new Date(p.ends).getTime()) {
    return { ...base, status: "ended", note: p ? "This offer ended on " + fmtTT(p.ends) + ". The code no longer works at the till." : "This offer has ended." };
  }
  if (p.status !== "approved") return { ...base, status: "ended", note: "This offer is paused. The code does not work at the till for now." };
  return { ...base, status: "ready" };
}

/** tabIndex -1 so the offer page can move focus to a code it has just handed out. */
export function CodeTicket({ code, title, benefit, where, status, note, tour, ref }: TicketProps) {
  const st = STATUS[status];
  const ready = status === "ready";
  return (
    <article className={"ticket" + (ready ? "" : " is-spent")} data-tour={tour} ref={ref} tabIndex={-1} aria-label={"Code for " + benefit}>
      <div className="ticket-top">
        <div className="ticket-head">
          <p className="ticket-title">{title}</p>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>
        <h3 className="ticket-benefit">{benefit}</h3>
        {where ? <p className="ticket-where">{where}</p> : null}
      </div>
      <div className="ticket-tear" aria-hidden="true" />
      <div className="ticket-body">
        <p className="ticket-code-label">{ready ? "Your code" : "Code"}</p>
        <p className="ticket-code">
          <span aria-hidden="true">{code}</span>
          <span className="visually-hidden">{spelledCode(code)}</span>
        </p>
        {ready ? <CodePattern code={code} /> : null}
        <p className="ticket-note">{note || "Show this at the till before you pay. The cashier types the code in and records it."}</p>
        {ready ? (
          <p className="ticket-fine" aria-hidden="true">
            The stripes are decoration for this demo, not a barcode.
          </p>
        ) : null}
      </div>
    </article>
  );
}
