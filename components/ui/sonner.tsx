"use client"

import { Toaster as Sonner, toast as sonnerToast, type ToasterProps } from "sonner"

// The static site's toasts (styles/tokens.css .toast): ink, green for done, red for a problem, centred at the
// bottom, gone after 3.6 s. Sonner only supplies the queue and the live region.
const Toaster = (props: ToasterProps) => (
  <Sonner
    position="bottom-center"
    duration={3600}
    offset={24}
    mobileOffset={16}
    gap={8}
    toastOptions={{
      unstyled: true,
      classNames: { toast: "toast" },
    }}
    {...props}
  />
)

/** toast(message) in ink, toast(message, "ok") in green, toast(message, "bad") in red. Plain toasts with a class,
 *  not toast.success/error, because those add an icon the static site never had. */
function toast(message: string, kind?: "ok" | "bad") {
  sonnerToast(message, kind ? { className: `toast-${kind}` } : undefined)
}

export { Toaster, toast }
