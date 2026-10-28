import * as React from "react"

// Styled by the label rule in styles/tokens.css (bold, 1 rem, above its field).
function Label(props: React.ComponentProps<"label">) {
  return <label data-slot="label" {...props} />
}

export { Label }
