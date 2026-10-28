"use client";

import { SiteFrame } from "@/components/site-frame";
import { PriceSeal } from "@/components/price-seal";
import { Pic } from "@/components/pic";
import { DocBadge, StageBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { useConfirm } from "@/components/confirm";

// Temporary check page for the styles layer; deleted before the preview deploy.
export default function StyleCheck() {
  const { confirm, prompt } = useConfirm();
  return (
    <SiteFrame active="specials" banner>
      <div className="container section">
        <p className="eyebrow">Style check</p>
        <h1>Fresh this week</h1>
        <p className="lede">A paragraph with <a href="/specials">a link</a> and the browser defaults put back.</p>
        <ul><li>First bullet</li><li>Second bullet</li></ul>
        <p className="cluster">
          <Button>Primary</Button><Button variant="accent">Accent</Button><Button variant="ghost">Ghost</Button>
          <Button variant="danger" size="sm">Danger</Button>
          <Button variant="ghost" onClick={async () => toast((await confirm({ title: "Delete it?", body: "This clears the note.", danger: true })) ? "Deleted" : "Kept", "ok")}>Confirm</Button>
          <Button variant="ghost" onClick={async () => toast((await prompt({ title: "Flag document", label: "Reason" })) ?? "Cancelled", "bad")}>Prompt</Button>
        </p>
        <p className="cluster"><Badge>Submitted</Badge><Badge variant="ok">Verified</Badge><Badge variant="warn">Pending</Badge><Badge variant="bad">Flagged</Badge></p>
        <Card>
          <Field><Label htmlFor="n">Your name</Label><Input id="n" aria-describedby="n-h" /><FieldHint id="n-h">As on your ID.</FieldHint></Field>
          <Field><label htmlFor="s">Branch</label><select id="s"><option>Penal</option><option>Debe</option></select></Field>
          <Field><label className="check"><input type="checkbox" defaultChecked /> I agree</label></Field>
        </Card>
        <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead num>Price</TableHead></TableRow></TableHeader>
          <TableBody><TableRow><TableCell>Coconut cake</TableCell><TableCell num>TTD 45.00</TableCell></TableRow></TableBody></Table>
        <p className="cluster"><StageBadge stage="kyc" /><StageBadge stage="offer" /><DocBadge state="expiring" /><DocBadge state="missing" /></p>
        <div style={{ display: "flex", gap: 24 }}>
          <div className="deal" style={{ width: 220 }}><figure className="deal-photo"><img src="/assets/img/photos/ripples.webp" alt="" width="800" height="667" /><PriceSeal price={6} /></figure></div>
          <Pic src="/assets/img/photos/nope.webp" alt="" ar="4 / 3" className="dept-tile-pic" />
        </div>
      </div>
    </SiteFrame>
  );
}
