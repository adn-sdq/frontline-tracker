import { useState, useRef, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"
import {
  X,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  User,
  Tag,
  Calendar,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
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
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
      <Sheet open={!!ticket} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
          {/* Sticky header */}
          <div className="shrink-0 border-b px-5 py-4 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</p>
                <SheetTitle className="text-base leading-snug mt-0.5">{ticket.title}</SheetTitle>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 -mr-1 -mt-1" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge className={TICKET_PRIORITY_STYLES[ticket.priority]}>
                {TICKET_PRIORITY_LABELS[ticket.priority]}
              </Badge>
              <Badge className={TICKET_STATUS_STYLES[ticket.status]}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
              <Badge variant="outline">{TICKET_CATEGORY_LABELS[ticket.category]}</Badge>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Quick status change */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Move to</p>
              <div className="flex flex-wrap gap-1.5">
                {TICKET_STATUSES.filter((s) => s !== ticket.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-opacity hover:opacity-80 ${TICKET_STATUS_STYLES[s]}`}
                  >
                    {TICKET_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Details grid */}
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{ticket.project_name}</p>
                  {ticket.site_location && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {ticket.site_location}
                    </p>
                  )}
                </div>
              </div>
              {(ticket.site_contact || ticket.site_phone) && (
                <div className="flex gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    {ticket.site_contact && <p className="font-medium">{ticket.site_contact}</p>}
                    {ticket.site_phone && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {ticket.site_phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {ticket.assigned_to && (
                <div className="flex gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p><span className="text-muted-foreground">Assigned to </span>{nameFor(ticket.assigned_to)}</p>
                </div>
              )}
              <div className="flex gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Opened by {nameFor(ticket.created_by)} · {format(new Date(ticket.created_at), "d MMM yyyy")}</p>
              </div>
            </div>

            {ticket.description && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Comments thread */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Comments ({comments.length})
              </p>
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No comments yet.</p>
              )}
              {comments.map((c) => {
                const isMe = c.author === user?.id
                return (
                  <div key={c.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                      {nameFor(c.author).slice(0, 2).toUpperCase()}
                    </div>
                    <div className={`max-w-[80%] space-y-0.5 ${isMe ? "items-end" : ""}`}>
                      <p className={`text-xs text-muted-foreground ${isMe ? "text-right" : ""}`}>
                        {nameFor(c.author)} · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </p>
                      <div className={`rounded-xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {c.body}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Sticky footer: comment input + actions */}
          <div className="shrink-0 border-t px-4 py-3 space-y-2">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment…"
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
                {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
              <Button type="button" size="sm" onClick={() => onEdit(ticket)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit ticket
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Delete ticket?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {ticket.ticket_number} and all its comments. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
