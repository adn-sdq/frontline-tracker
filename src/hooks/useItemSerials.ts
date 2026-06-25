import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { ItemSerial } from "@/lib/types"

export function useItemSerials(itemId: string | null) {
  return useQuery<ItemSerial[]>({
    queryKey: ["item_serials", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_serials")
        .select("*")
        .eq("item_id", itemId!)
        .order("unit_index")
      if (error) throw error
      return (data ?? []) as ItemSerial[]
    },
    enabled: !!itemId,
  })
}

// Batch fetch for multiple items — used by DeliveryNoteDialog.
export function useItemSerialsForItems(itemIds: string[]) {
  return useQuery<ItemSerial[]>({
    queryKey: ["item_serials_batch", itemIds],
    queryFn: async () => {
      if (!itemIds.length) return []
      const { data, error } = await supabase
        .from("item_serials")
        .select("*")
        .in("item_id", itemIds)
        .order("item_id")
        .order("unit_index")
      if (error) throw error
      return (data ?? []) as ItemSerial[]
    },
    enabled: itemIds.length > 0,
  })
}

// Upsert a single serial slot — creates the row if it doesn't exist yet.
export function useUpsertSerial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      unitIndex,
      serialNumber,
      notes,
    }: {
      itemId: string
      unitIndex: number
      serialNumber: string
      notes?: string
    }) => {
      const { error } = await supabase.from("item_serials").upsert(
        {
          item_id: itemId,
          unit_index: unitIndex,
          serial_number: serialNumber || null,
          notes: notes ?? null,
        },
        { onConflict: "item_id,unit_index" }
      )
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["item_serials", vars.itemId] })
      qc.invalidateQueries({ queryKey: ["item_serials_batch"] })
    },
  })
}
