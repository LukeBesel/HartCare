"use client";

import { createClient, SUPABASE_ENABLED } from "@/lib/supabase/client";
import { deleteRow, loadHousehold, upsertRow } from "@/lib/db/sync";
import { setPersistAdapter, useStore, type ArrayKeys } from "@/lib/store";
import { useEffect } from "react";

// Tables scoped to a household — inserts need a household_id for RLS to pass.
const HOUSEHOLD_SCOPED: ArrayKeys[] = ["recipes", "groceryItems", "pets", "notifications"];

/**
 * When a live Supabase backend is configured AND the user is signed in, this
 * hydrates the store from the database, registers a write-through persistence
 * adapter, and subscribes to realtime changes. In demo mode it renders nothing
 * and the app stays purely local-first.
 */
export function SupabaseSync() {
  useEffect(() => {
    if (!SUPABASE_ENABLED) return;
    const supabase = createClient();
    let active = true;
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;

    async function start() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const data = await loadHousehold(supabase);
      if (!active) return;
      useStore.getState().hydrate(data);

      const householdId = useStore.getState().db.households[0]?.id;

      const normalize = (key: ArrayKeys, row: Record<string, unknown>) => {
        const r = { ...row };
        delete r.isPet; // client-only flag, no column
        if (HOUSEHOLD_SCOPED.includes(key) && !r.householdId && householdId) {
          r.householdId = householdId;
        }
        return r;
      };

      setPersistAdapter({
        upsert: (key, row) => void upsertRow(supabase, key, normalize(key, row)),
        remove: (key, id) => void deleteRow(supabase, key, id),
        upsertSingle: (key, value) => {
          const table = key === "subscription" ? "subscriptions" : "settings";
          const payload = { ...value, household_id: householdId };
          void supabase.from(table).upsert(payload).then(({ error }) => {
            if (error) console.warn(`[sync] ${table} upsert failed:`, error.message);
          });
        },
      });

      // Realtime: reload the household on any change (debounced).
      const channel = supabase
        .channel("hartcare-sync")
        .on("postgres_changes", { event: "*", schema: "public" }, () => {
          if (reloadTimer) clearTimeout(reloadTimer);
          reloadTimer = setTimeout(async () => {
            const fresh = await loadHousehold(supabase);
            if (active) useStore.getState().hydrate(fresh);
          }, 400);
        })
        .subscribe();

      return channel;
    }

    const channelPromise = start();

    return () => {
      active = false;
      if (reloadTimer) clearTimeout(reloadTimer);
      setPersistAdapter(null);
      channelPromise.then((ch) => ch && supabase.removeChannel(ch));
    };
  }, []);

  return null;
}
