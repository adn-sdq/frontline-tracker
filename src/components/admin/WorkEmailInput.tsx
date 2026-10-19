import { Input } from "@/components/ui/input"
import { PRIMARY_EMAIL_DOMAIN } from "@/lib/email"

/** Username box with the company domain fixed after it — only work emails can be entered. */
export function WorkEmailInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/40">
      <Input
        autoFocus={autoFocus}
        value={value}
        // Pasting a full address keeps only the name part; the domain is fixed.
        onChange={(e) => onChange(e.target.value.replace(new RegExp(`@${PRIMARY_EMAIL_DOMAIN.replace(".", "\\.")}$`, "i"), ""))}
        placeholder="e.g. khalid"
        autoCapitalize="none"
        autoComplete="off"
        className="flex-1 rounded-none border-0 shadow-none focus-visible:ring-0"
      />
      <span className="flex items-center border-l bg-muted px-2.5 text-sm text-muted-foreground">@{PRIMARY_EMAIL_DOMAIN}</span>
    </div>
  )
}
