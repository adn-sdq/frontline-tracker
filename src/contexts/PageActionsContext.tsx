import { createContext, useContext, type ReactNode } from "react"
import { createPortal } from "react-dom"

/**
 * Holds a reference to the DOM node inside the TopBar where page-level
 * action buttons are rendered. Each page uses <PageActions> to portal its
 * primary CTAs into that slot so the top bar always shows contextual actions.
 */
export const PageActionsContext = createContext<HTMLDivElement | null>(null)

/**
 * Renders children into the top-bar action slot via a React portal.
 * Place this at the top of a page's return value alongside the main content.
 *
 * @example
 * return (
 *   <>
 *     <PageActions>
 *       <Button size="sm" onClick={openAdd}>Add item</Button>
 *     </PageActions>
 *     <div>... page content ...</div>
 *   </>
 * )
 */
export function PageActions({ children }: { children: ReactNode }) {
  const container = useContext(PageActionsContext)
  if (!container) return null
  return createPortal(children, container)
}
