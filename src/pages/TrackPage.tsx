import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/PageHeader"
import { UnitPanel } from "@/components/scan/UnitPanel"
import { extractTag } from "@/lib/tags"

/**
 * Where a scanned FIT label lands. Signing in is required, and the unit only
 * appears for members of its project (row-level security) — anyone else sees
 * "nothing found".
 */
export default function TrackPage() {
  const { tag = "" } = useParams()
  const clean = extractTag(decodeURIComponent(tag))
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="size-4" /> Tracker</Link>
        </Button>
      </div>
      <PageHeader title="Unit tracking" subtitle="Where this unit is, and what has happened to it." />
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <UnitPanel tag={clean} />
      </div>
    </div>
  )
}
