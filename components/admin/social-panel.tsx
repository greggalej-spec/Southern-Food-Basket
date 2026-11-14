"use client";

import { useState } from "react";
import { act } from "@/components/admin/bits";
import { PLATFORM_COLOR } from "@/components/admin/chart";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { Flow, Working } from "@/components/viz";
import { can } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { dayTT } from "@/lib/admin/tt";
import { setConnected } from "@/lib/ops/social";
import { useData, useSession } from "@/lib/store";
import type { SocialAccount } from "@/lib/types";

/* Social accounts: which accounts feed the figures, and the connection step for each. In the prototype nothing
   leaves the browser, so "connect" walks through what the real step is and then switches the account on with the
   demo figures. The real connection is read-only: the system can count, never post. */

export function SocialPanel() {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const canConnect = can(d, s, "social.connect");
  const [connecting, setConnecting] = useState<SocialAccount | null>(null);
  const [working, setWorking] = useState(false);

  async function disconnect(a: SocialAccount) {
    if (await confirm({ title: "Disconnect " + a.name + "?", body: "Its figures stop updating and leave the Marketing figures page. Nothing on the account itself changes.", okLabel: "Disconnect", danger: true }))
      act(s, "social.disconnect", a.name, () => setConnected(s, a.id, false), a.name + " disconnected.");
  }

  return (
    <div className="section-stack">
      <Flow id="social" />
      <div className="account-grid" data-tour="social-accounts">
        {(d.socialAccounts || []).map((a) => (
          <section className="panel account" key={a.id} aria-labelledby={"acc-" + a.id}>
            <div className="panel-head">
              <h2 id={"acc-" + a.id}>
                <span className="chart-key" style={{ background: PLATFORM_COLOR[a.id] }} />
                {a.name}
              </h2>
              {a.connected ? <Badge variant="ok">Connected</Badge> : <Badge variant="warn">Not connected</Badge>}
            </div>
            <div className="panel-body">
              <p className="account-handle">
                {a.url.startsWith("/") ? a.handle : (
                  <a href={a.url} target="_blank" rel="noreferrer">
                    {a.handle}
                  </a>
                )}
              </p>
              <dl className="kv">
                <dt>What it gives</dt>
                <dd>{a.gives}</dd>
                <dt>To connect</dt>
                <dd>{a.needs}</dd>
                {a.connected && a.connectedAt ? (
                  <>
                    <dt>Connected</dt>
                    <dd>{dayTT(a.connectedAt) + " by " + personName(d, a.connectedBy)}</dd>
                  </>
                ) : null}
              </dl>
              {canConnect && a.id !== "website" ? (
                a.connected ? (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => disconnect(a)}>
                    Disconnect
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => setConnecting(a)} data-tour={"connect-" + a.id}>
                    {"Connect " + a.name}
                  </button>
                )
              ) : null}
            </div>
          </section>
        ))}
      </div>
      <SideSheet open={!!connecting} onClose={() => setConnecting(null)} title={connecting ? "Connect " + connecting.name : "Connect"} sub="A walk through the real step.">
        {connecting ? (
          <div className="connect-steps">
            <ol>
              <li>
                <strong>{"Sign in on " + connecting.name + "."}</strong> In the real system this button opens {connecting.name}’s own sign-in page in a new window. The store’s password is typed there, never here.
              </li>
              <li>
                <strong>Approve read-only access.</strong> {connecting.name} lists exactly what is being asked for: the account’s figures, and nothing else.
              </li>
              <li>
                <strong>Come back here.</strong> The account shows as connected and its figures arrive overnight.
              </li>
            </ol>
            <div className="alert alert-info" role="note">
              <p>
                <strong>Prototype.</strong> No account is contacted. The button below stands in for a successful sign-in and switches on the demo figures for {connecting.name}.
              </p>
            </div>
            {working ? (
              <Working
                steps={["Opening " + connecting.name + "’s sign-in page", "Approving read-only access", "Fetching the last twelve weeks of figures"]}
                stepMs={700}
                onDone={() => {
                  setWorking(false);
                  if (act(s, "social.connect", connecting.name, () => setConnected(s, connecting.id, true), connecting.name + " connected. Its figures are on the Marketing figures page.")) setConnecting(null);
                }}
              />
            ) : (
              <button className="btn btn-primary" type="button" data-tour="connect-confirm" onClick={() => setWorking(true)}>
                Simulate a successful connection
              </button>
            )}
          </div>
        ) : null}
      </SideSheet>
    </div>
  );
}


/* The content calendar is its own file now (a real month and year calendar). */
export { PlanPanel } from "./plan-calendar";
