"use client";

import { useSyncExternalStore } from "react";

const noSub = () => () => {};

/** Today in Trinidad as "YYYY-MM-DD". Empty on the server and on the first paint, so a page never guesses the date
 *  while it is being built; components treat "" as "not known yet". */
export function useToday() {
  return useSyncExternalStore(noSub, () => new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10), () => "");
}
