import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ItemHistoryList } from "@/components/ItemHistoryList"
import type { Item } from "@/lib/types"

export function HistoryDrawer({
  item,
  onClose,
}: {
  item: Item | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit history</SheetTitle>
          <SheetDescription>
            {item ? `${item.brand ?? ""} ${item.model_no ?? ""}`.trim() || "Line item" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          <ItemHistoryList itemId={item?.id ?? null} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
