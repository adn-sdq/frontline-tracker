import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"

/**
 * Pages call this to open their "create" dialog when reached through the
 * top-bar New menu (…?new=1). The flag is removed so a refresh doesn't reopen it.
 */
export function useOpenOnNew(open: () => void) {
  const [params, setParams] = useSearchParams()
  const flag = params.get("new")
  useEffect(() => {
    if (flag !== "1") return
    open()
    setParams((p) => {
      p.delete("new")
      return p
    }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag])
}
