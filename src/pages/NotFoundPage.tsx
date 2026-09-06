import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FitLogo } from "@/components/FitLogo"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <FitLogo size={44} />

      <div className="flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Compass className="size-8 text-muted-foreground" />
        </div>
        <p className="font-mono text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="font-display text-2xl tracking-tight">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or may have moved. Check the
          address or head back to a familiar place.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> Go back
        </Button>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
