"use client";

import { createContext, useCallback, useContext, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// SFBUI.confirm and SFBUI.prompt from the static site, as promises:
//   const ok = await confirm({ title, body, okLabel, danger })      -> boolean
//   const reason = await prompt({ title, body, label, placeholder }) -> string | null
type ConfirmOpts = { title?: string; body?: string; okLabel?: string; danger?: boolean };
type PromptOpts = { title?: string; body?: string; label?: string; placeholder?: string; okLabel?: string };
type Request =
  | { kind: "confirm"; opts: ConfirmOpts; resolve: (v: boolean) => void }
  | { kind: "prompt"; opts: PromptOpts; resolve: (v: string | null) => void };

const Ctx = createContext<{
  confirm: (o?: ConfirmOpts) => Promise<boolean>;
  prompt: (o?: PromptOpts) => Promise<string | null>;
} | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<Request | null>(null);
  const [open, setOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const confirm = useCallback(
    (opts: ConfirmOpts = {}) => new Promise<boolean>((resolve) => { setReq({ kind: "confirm", opts, resolve }); setOpen(true); }),
    [],
  );
  const prompt = useCallback(
    (opts: PromptOpts = {}) => new Promise<string | null>((resolve) => { setReq({ kind: "prompt", opts, resolve }); setOpen(true); }),
    [],
  );

  function finish(ok: boolean) {
    if (!req) return;
    if (req.kind === "confirm") req.resolve(ok);
    else req.resolve(ok ? (textRef.current?.value.trim() ?? "") : null);
    setOpen(false);
  }

  const o = req?.opts ?? {};
  return (
    <Ctx.Provider value={{ confirm, prompt }}>
      {children}
      <Dialog open={open} onOpenChange={(next) => { if (!next) finish(false); }}>
        <DialogContent initialFocus={req?.kind === "prompt" ? textRef : undefined}>
          <form onSubmit={(e) => { e.preventDefault(); finish(true); }}>
            <DialogBody>
              <DialogTitle>{o.title || (req?.kind === "confirm" ? "Are you sure?" : "")}</DialogTitle>
              {o.body ? <DialogDescription>{o.body}</DialogDescription> : null}
              {req?.kind === "prompt" ? (
                <>
                  <Label htmlFor={inputId}>{(o as PromptOpts).label || "Reason"}</Label>
                  <Textarea id={inputId} ref={textRef} placeholder={(o as PromptOpts).placeholder || ""} />
                </>
              ) : null}
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => finish(false)}>Cancel</Button>
              <Button variant={req?.kind === "confirm" && (o as ConfirmOpts).danger ? "danger" : "primary"} type="submit">
                {o.okLabel || (req?.kind === "confirm" ? "Confirm" : "Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConfirm needs <ConfirmProvider> (app/(sfb)/layout.tsx)");
  return ctx;
}
