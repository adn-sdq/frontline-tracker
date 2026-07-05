import { useState, useRef, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"
import {
  Pencil,
  Trash2,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
  Phone,
} from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { DetailSection, Property, PropertyList } from "@/components/PropertyList"

import { useAuth } from "@/contexts/AuthContext"
import { useAllProfiles } from "@/hooks/useAdmin"
import {
  useTicketComments,
  useAddTicketComment,
  useDeleteTicket,
  useUpdateTicket,
} from "@/hooks/useTickets"
import type { Ticket, TicketStatus } from "@/lib/types"
import {
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_STYLES,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_STYLES,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUSES,
} from "@/lib/types"

interface Props {
  ticket: Ticket | null
  onClose: () => void
  onEdit: (t: Ticket) => void
}

/**
 * Ticket detail — wide two-column dialog: description + comment thread on
 * the left, a properties rail (status, priority, site, people) on the right,
 * with the comment composer pinned along the bottom.
 */
export function TicketDetailSheet({ ticket, onClose, onEdit }: Props) {
  const { user } = useAuth()
  const { data: profiles = [] } = useAllProfiles()
  const { data: comments = [] } = useTicketComments(ticket?.id ?? null)
  const addComment = useAddTicketComment()
  const deleteTicket = useDeleteTicket()
  const updateTicket = useUpdateTicket()

  const [commentBody, setCommentBody] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Reset delete confirmation when a different ticket is opened.
  const ticketIdRef = useRef<string | undefined>(undefined)
  if (ticket?.id !== ticketIdRef.current) {
    ticketIdRef.current = ticket?.id
    if (confirmDelete) setConfirmDelete(false)
  }

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [comments.length])

  if (!ticket) return null

  function nameFor(uid: string | null) {
    if (!uid) return "Unknown"
    const p = profiles.find((p) => p.id === uid)
    return p?.full_name ?? p?.username ?? "Unknown"
  }

  async function submitComment() {
    if (!commentBody.trim() || !ticket) return
    try {
      await addComment.mutateAsync({ ticketId: ticket.id, body: commentBody.trim() })
      setCommentBody("")
    } catch {
      toast.error("Failed to post comment")
    }
  }

  async function handleDelete() {
    try {
      await deleteTicket.mutateAsync(ticket!.id)
      toast.success("Ticket deleted")
      onClose()
    } catch {
      toast.error("Failed to delete ticket")
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    try {
      await updateTicket.mutateAsync({ id: ticket!.id, patch: { status } })
      toast.success(`Status → ${TICKET_STATUS_LABELS[status]}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  return (
    <>
      <Dialog open={!!ticket} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="flex max-h-[85svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          {/* ── Header: number + title left, actions right ─────────────── */}
          <DialogHeader className="shrink-0 gap-3 border-b px-6 pb-4 pt-5 pr-14 text-left sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</p>
              <DialogTitle className="mt-1 text-lg leading-snug">{ticket.title}</DialogTitle>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(ticket)}>
                <Pencil className="size-4" /> Edit
              </Button>
            </div>
          </DialogHeader>

          {/* ── Body: thread left, properties rail right ─────────────────── */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid md:grid-cols-[1fr_280px]">
              {/* Main column */}
              <div className="flex min-w-0 flex-col gap-6 px-6 py-5">
                {ticket.description && (
                  <DetailSection title="Description">
                    <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  </DetailSection>
                )}

                <DetailSection
                  title={`Comments (${comments.length})`}
                  icon={MessageSquare}
                >
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                  <div className="flex flex-col gap-3">
                    {comments.map((c) => {
                      const isMe = c.author === user?.id
                      return (
                        <div key={c.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {nameFor(c.author).slice(0, 2).toUpperCase()}
                          </div>
                          <div className={`max-w-[80%] space-y-0.5 ${isMe ? "items-end" : ""}`}>
                            <p className={`text-xs text-muted-foreground ${isMe ? "text-right" : ""}`}>
                              {nameFor(c.author)} ·{" "}
                              {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                            </p>
                            <div
                              className={`rounded-lg px-3 py-2 text-sm ${
                                isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              {c.body}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={commentsEndRef} />
                  </div>
                </DetailSection>
              </div>

              {/* Properties rail */}
              <aside className="border-t bg-muted/20 px-6 py-5 md:border-t-0 md:border-l">
                <h3 className="mb-3 text-sm font-semibold">Details</h3>

                <PropertyList>
                  <Property label="Status">
                    <Badge className={TICKET_STATUS_STYLES[ticket.status]}>
                      {TICKET_STATUS_LABELS[ticket.status]}
                    </Badge>
                  </Property>
                  <Property label="Priority">
                    <Badge className={TICKET_PRIORITY_STYLES[ticket.priority]}>
                      {TICKET_PRIORITY_LABELS[ticket.priority]}
                    </Badge>
                  </Property>
                  <Property label="Category">{TICKET_CATEGORY_LABELS[ticket.category]}</Property>
                </PropertyList>

                <div className="mt-3">
                  <p className="mb-1.5 text-xs text-muted-foreground">Move to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TICKET_STATUSES.filter((s) => s !== ticket.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(s)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${TICKET_STATUS_STYLES[s]}`}
                      >
                        {TICKET_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                <PropertyList>
                  <Property label="Project">{ticket.project_name}</Property>
                  <Property label="Location">{ticket.site_location}</Property>
                  <Property label="Contact">
                    {(ticket.site_contact || ticket.site_phone) && (
                      <span className="flex flex-col gap-0.5">
                        {ticket.site_contact && <span>{ticket.site_contact}</span>}
                        {ticket.site_phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="size-3" /> {ticket.site_phone}
                          </span>
                        )}
                      </span>
                    )}
                  </Property>
                  <Property label="Assigned to">
                    {ticket.assigned_to ? nameFor(ticket.assigned_to) : null}
                  </Property>
                </PropertyList>

                <Separator className="my-4" />

                <PropertyList className="text-xs">
                  <Property label="Opened by">{nameFor(ticket.created_by)}</Property>
                  <Property label="Opened">
                    {format(new Date(ticket.created_at), "d MMM yyyy")}
                  </Property>
                </PropertyList>
              </aside>
            </div>
          </div>

          {/* ── Composer — pinned to the bottom, spans both columns ──────── */}
          <div className="shrink-0 border-t px-4 py-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment…  (⌘↵ to send)"
                rows={2}
                className="resize-none text-sm"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment()
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={submitComment}
                disabled={!commentBody.trim() || addComment.isPending}
              >
                {addComment.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" /> Delete ticket?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {ticket.ticket_number} and all its comments. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
