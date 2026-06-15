"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildSeed, SEED_IDS, type DB } from "./seed";
import { uid } from "./utils";
import type { AppNotification, PlanTier, Settings, Subscription } from "./types";

/** Collections that are arrays of records with an `id`. */
type ArrayKeys = {
  [K in keyof DB]: DB[K] extends Array<infer _U> ? K : never;
}[keyof DB];

type ItemOf<K extends ArrayKeys> = DB[K] extends Array<infer U> ? U : never;

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

  resetDemo: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      db: buildSeed(),
      currentProfileId: SEED_IDS.P_DAD,
      hydrated: false,

      setCurrentProfile: (id) => set({ currentProfileId: id }),

      add: (key, item) => {
        const id = (item as { id?: string }).id ?? uid(String(key).slice(0, 2));
        set((s) => ({
          db: { ...s.db, [key]: [{ ...(item as object), id }, ...(s.db[key] as unknown[])] },
        }));
        return id;
      },

      update: (key, id, patch) =>
        set((s) => ({
          db: {
            ...s.db,
            [key]: (s.db[key] as Array<{ id: string }>).map((row) =>
              row.id === id ? { ...row, ...patch } : row,
            ),
          },
        })),

      remove: (key, id) =>
        set((s) => ({
          db: {
            ...s.db,
            [key]: (s.db[key] as Array<{ id: string }>).filter((row) => row.id !== id),
          },
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          db: {
            ...s.db,
            notifications: s.db.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
          },
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          db: {
            ...s.db,
            notifications: s.db.notifications.map((n) => ({ ...n, read: true })),
          },
        })),

      pushNotification: (n) =>
        set((s) => ({
          db: {
            ...s.db,
            notifications: [
              { ...n, id: uid("n"), read: false, date: n.date ?? new Date().toISOString().slice(0, 10) },
              ...s.db.notifications,
            ],
          },
        })),

      updateSettings: (patch) =>
        set((s) => ({ db: { ...s.db, settings: { ...s.db.settings, ...patch } } })),

      updateSubscription: (patch) =>
        set((s) => ({ db: { ...s.db, subscription: { ...s.db.subscription, ...patch } } })),

      setTier: (tier) =>
        set((s) => ({
          db: {
            ...s.db,
            subscription: {
              ...s.db.subscription,
              tier,
              hartHomeConnected: tier === "free" ? false : s.db.subscription.hartHomeConnected,
            },
          },
        })),

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
