import * as React from "react"

// Styled by the textarea rules in styles/tokens.css.
function Textarea(props: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" {...props} />
}

export { Textarea }
