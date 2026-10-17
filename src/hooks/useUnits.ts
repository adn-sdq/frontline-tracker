import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabase"
import { parseTag } from "@/lib/tags"
import type { Item, ItemSerial, UnitEvent, UnitEventKind } from "@/lib/types"

export interface ResolvedTag {
  item: Item
  /** null = the whole lot */
  unit: number | null
  serial: string | null
}

/**
 * Find what a tag, SKU or serial number refers to. Row-level security limits
 * this to projects the signed-in user belongs to.
 */
export async function resolveTag(raw: string): Promise<ResolvedTag | null> {
  const text = raw.trim()
  if (!text) return null
  const { sku, unit } = parseTag(text)

  const bySku = await supabase.from("items").select("*").eq("sku", sku).maybeSingle()
  if (bySku.error) throw bySku.error
  if (bySku.data) {
    const item = bySku.data as Item
    if (item.tracking === "lot") return { item, unit: null, serial: null }
    if (unit === null) return { item, unit: null, serial: null }
    const s = await supabase.from("item_serials").select("serial_number").eq("item_id", item.id).eq("unit_index", unit).maybeSingle()
    return { item, unit, serial: (s.data as Pick<ItemSerial, "serial_number"> | null)?.serial_number ?? null }
  }

  // Not a SKU — try it as a device serial number.
  const bySerial = await supabase.from("item_serials").select("item_id, unit_index, serial_number").ilike("serial_number", text.replace(/[%_]/g, "\\$&")).limit(1)
  if (bySerial.error) throw bySerial.error
  const hit = bySerial.data?.[0]
  if (!hit) return null
  const it = await supabase.from("items").select("*").eq("id", hit.item_id).maybeSingle()
  if (!it.data) return null
  return { item: it.data as Item, unit: hit.unit_index, serial: hit.serial_number }
}

export function useResolvedTag(raw: string) {
  return useQuery<ResolvedTag | null>({
    queryKey: ["resolved_tag", raw],
    queryFn: () => resolveTag(raw),
    enabled: !!raw,
    retry: false,
  })
}

export function useUnitEvents(itemId: string | null) {
  return useQuery<UnitEvent[]>({
    queryKey: ["unit_events", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_unit_events")
        .select("*")
        .eq("item_id", itemId!)
        .order("created_at", { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []) as UnitEvent[]
    },
  })
}

export function useAddUnitEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (e: { itemId: string; unit: number | null; kind: UnitEventKind; location?: string; note?: string }) => {
      const { error } = await supabase.from("item_unit_events").insert({
        item_id: e.itemId,
        unit_index: e.unit,
        kind: e.kind,
        location: e.location?.trim() || null,
        note: e.note?.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["unit_events", v.itemId] }),
  })
}
