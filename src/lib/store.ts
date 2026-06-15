"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSeed, SEED_IDS, type DB } from "./seed";
import { uid } from "./utils";
import type { AppNotification, PlanTier, Settings, Subscription } from "./types";

/** Collections that are arrays of records with an `id`. */
type ArrayKeys = {
  [K in keyof DB]: DB[K] extends Array<unknown> ? K : never;
}[keyof DB];

type ItemOf<K extends ArrayKeys> = DB[K] extends Array<infer U> ? U : never;

/**
 * Optional write-through adapter. When a live Supabase backend is connected
 * (see src/components/supabase-sync.tsx) it registers an adapter here so every
 * mutation is persisted. In demo mode it stays null and the store is purely
 * local-first.
 */
export interface PersistAdapter {
  upsert: (key: ArrayKeys, row: Record<string, unknown>) => void;
  remove: (key: ArrayKeys, id: string) => void;
  upsertSingle: (key: "subscription" | "settings", value: Record<string, unknown>) => void;
}
let persistAdapter: PersistAdapter | null = null;
export function setPersistAdapter(a: PersistAdapter | null) {
  persistAdapter = a;
}

interface StoreState {
  db: DB;
  currentProfileId: string;
  hydrated: boolean;

  setCurrentProfile: (id: string) => void;

  add: <K extends ArrayKeys>(key: K, item: Partial<ItemOf<K>>) => string;
  update: <K extends ArrayKeys>(key: K, id: string, patch: Partial<ItemOf<K>>) => void;
  remove: <K extends ArrayKeys>(key: K, id: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<AppNotification, "id" | "read" | "date"> & { date?: string }) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  updateSubscription: (patch: Partial<Subscription>) => void;
  setTier: (tier: PlanTier) => void;

  hydrate: (partial: Partial<DB>) => void;
  resetDemo: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      db: buildSeed(),
      currentProfileId: SEED_IDS.P_DAD,
      hydrated: false,

      setCurrentProfile: (id) => set({ currentProfileId: id }),

      add: (key, item) => {
        const id = (item as { id?: string }).id ?? uid(String(key).slice(0, 2));
        const row = { ...(item as object), id } as Record<string, unknown>;
        set((s) => ({
          db: { ...s.db, [key]: [row, ...(s.db[key] as unknown[])] },
        }));
        persistAdapter?.upsert(key, row);
        return id;
      },

      update: (key, id, patch) =>
        set((s) => {
          const next = (s.db[key] as Array<{ id: string }>).map((row) =>
            row.id === id ? { ...row, ...patch } : row,
          );
          const updated = next.find((r) => r.id === id);
          if (updated) persistAdapter?.upsert(key, updated as Record<string, unknown>);
          return { db: { ...s.db, [key]: next } };
        }),

      remove: (key, id) => {
        set((s) => ({
          db: {
            ...s.db,
            [key]: (s.db[key] as Array<{ id: string }>).filter((row) => row.id !== id),
          },
        }));
        persistAdapter?.remove(key, id);
      },

      markNotificationRead: (id) =>
        set((s) => {
          const notifications = s.db.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          );
          const n = notifications.find((x) => x.id === id);
          if (n) persistAdapter?.upsert("notifications", n as unknown as Record<string, unknown>);
          return { db: { ...s.db, notifications } };
        }),

      markAllNotificationsRead: () =>
        set((s) => ({
          db: {
            ...s.db,
            notifications: s.db.notifications.map((n) => ({ ...n, read: true })),
          },
        })),

      pushNotification: (n) => {
        const row = { ...n, id: uid("n"), read: false, date: n.date ?? new Date().toISOString().slice(0, 10) };
        set((s) => ({ db: { ...s.db, notifications: [row, ...s.db.notifications] } }));
        persistAdapter?.upsert("notifications", row as unknown as Record<string, unknown>);
      },

      updateSettings: (patch) =>
        set((s) => {
          const settings = { ...s.db.settings, ...patch };
          persistAdapter?.upsertSingle("settings", settings as unknown as Record<string, unknown>);
          return { db: { ...s.db, settings } };
        }),

      updateSubscription: (patch) =>
        set((s) => {
          const subscription = { ...s.db.subscription, ...patch };
          persistAdapter?.upsertSingle("subscription", subscription as unknown as Record<string, unknown>);
          return { db: { ...s.db, subscription } };
        }),

      setTier: (tier) =>
        set((s) => {
          const subscription = {
            ...s.db.subscription,
            tier,
            hartHomeConnected: tier === "free" ? false : s.db.subscription.hartHomeConnected,
          };
          persistAdapter?.upsertSingle("subscription", subscription as unknown as Record<string, unknown>);
          return { db: { ...s.db, subscription } };
        }),

      hydrate: (partial) => set((s) => ({ db: { ...s.db, ...partial }, hydrated: true })),

      resetDemo: () => set({ db: buildSeed(), currentProfileId: SEED_IDS.P_DAD }),
    }),
    {
      name: "hartcare-store-v1",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/* ----------------------------- selector hooks ----------------------------- */

export function useCurrentProfile() {
  return useStore((s) => s.db.profiles.find((p) => p.id === s.currentProfileId) ?? s.db.profiles[0]);
}

export function useProfiles() {
  return useStore((s) => s.db.profiles);
}

export function usePets() {
  return useStore((s) => s.db.pets);
}

export function useHousehold() {
  return useStore((s) => s.db.households[0]);
}

export function useSubscription() {
  return useStore((s) => s.db.subscription);
}

export function useSettings() {
  return useStore((s) => s.db.settings);
}

/**
 * Generic collection selector. Returns the stable raw array reference
 * (important for zustand v5 — never filter inside the selector or it will
 * return a new array every render). Filter with useMemo in the component.
 */
export function useCollection<K extends ArrayKeys>(key: K): ItemOf<K>[] {
  return useStore((s) => s.db[key] as ItemOf<K>[]);
}

export { SEED_IDS };
export type { ArrayKeys, ItemOf };
