import { useEffect } from "react";

/** site.js jumpToHash: scroll to the section named by #id once the page is up, and again on every hashchange. A
 *  malformed fragment is ignored. The sections are server-rendered now, so the browser's own jump usually lands first;
 *  this one corrects for anything that moved when the browser's demo data replaced the seed. */
export function useJumpToHash() {
  useEffect(() => {
    let frame = 0;
    function jump() {
      let id: string;
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
    }
    jump();
    window.addEventListener("hashchange", jump);
    return () => {
      window.removeEventListener("hashchange", jump);
      cancelAnimationFrame(frame);
    };
  }, []);
}
