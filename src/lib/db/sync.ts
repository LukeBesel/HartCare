import type { SupabaseClient } from "@supabase/supabase-js";
import type { DB } from "@/lib/seed";
import type { ArrayKeys } from "@/lib/store";
import { ALL_COLLECTIONS, columnsToRow, rowToColumns, TABLE_FOR } from "./mapper";

/**
 * Loads every collection the signed-in user can see (RLS scopes rows to their
 * household) and assembles a partial DB the store can hydrate from.
 */
export async function loadHousehold(supabase: SupabaseClient): Promise<Partial<DB>> {
  const result: Partial<DB> = {};

  await Promise.all(
    ALL_COLLECTIONS.map(async (key) => {
      const { data, error } = await supabase.from(TABLE_FOR[key]).select("*");
      if (error || !data) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = data.map((r) => columnsToRow(r as Record<string, unknown>));
    }),
  );

  const { data: subRows } = await supabase.from("subscriptions").select("*").limit(1);
  if (subRows?.[0]) {
    const s = columnsToRow(subRows[0] as Record<string, unknown>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any).subscription = {
      tier: s.tier, status: s.status, hartHomeConnected: s.hartHomeConnected,
      renewsOn: s.renewsOn, seats: s.seats ?? 1,
    };
  }

  const { data: setRows } = await supabase.from("settings").select("*").limit(1);
  if (setRows?.[0]) {
    const s = columnsToRow(setRows[0] as Record<string, unknown>);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any).settings = {
      theme: s.theme, units: s.units, notificationsEnabled: s.notificationsEnabled,
      waterGoalOz: s.waterGoalOz, stepGoal: s.stepGoal, sleepGoalHours: s.sleepGoalHours,
    };
  }

  return result;
}

/** Write-through helpers used by the store's persistence adapter. */
export async function upsertRow(
  supabase: SupabaseClient,
  key: ArrayKeys,
  row: Record<string, unknown>,
) {
  const cols = rowToColumns(row);
  const { error } = await supabase.from(TABLE_FOR[key]).upsert(cols);
  if (error) console.warn(`[sync] upsert ${key} failed:`, error.message);
}

export async function deleteRow(supabase: SupabaseClient, key: ArrayKeys, id: string) {
  const { error } = await supabase.from(TABLE_FOR[key]).delete().eq("id", id);
  if (error) console.warn(`[sync] delete ${key} failed:`, error.message);
}
