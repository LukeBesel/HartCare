"use client";

import {
  Avatar,
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import {
  useCollection,
  useCurrentProfile,
  useHousehold,
  usePets,
  useProfiles,
  useStore,
} from "@/lib/store";
import type { Role } from "@/lib/types";
import { ageFrom, cn, relativeDay, sum, todayISO } from "@/lib/utils";
import {
  Check,
  Heart,
  Plus,
  ShoppingCart,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const ROLE_OPTIONS: { label: string; value: Role }[] = [
  { label: "Parent", value: "parent" },
  { label: "Adult", value: "adult" },
  { label: "Child", value: "child" },
  { label: "Guest", value: "guest" },
];

const ROLE_COLOR: Record<Role, Parameters<typeof Badge>[0]["color"]> = {
  parent: "brand",
  adult: "mint",
  child: "amber",
  guest: "gray",
};

const COLOR_SWATCHES = [
  "#2a59d6",
  "#15ad76",
  "#f59e0b",
  "#a855f7",
  "#f43f5e",
  "#0ea5e9",
];

const EMOJI_CHOICES = ["🧔", "👩", "🧒", "👵", "👴", "👧", "👦", "🧑"];

const PERMISSIONS: { role: string; can: string; color: Parameters<typeof Badge>[0]["color"] }[] = [
  { role: "Parent", can: "Manage billing & members", color: "brand" },
  { role: "Adult", can: "Full access to all features", color: "mint" },
  { role: "Child", can: "Parent-controlled access", color: "amber" },
  { role: "Guest", can: "View-only", color: "gray" },
];

const SPECIES_EMOJI: Record<string, string> = { dog: "🐶", cat: "🐱" };

export default function FamilyPage() {
  const household = useHousehold();
  const profiles = useProfiles();
  const pets = usePets();
  const current = useCurrentProfile();
  const setCurrentProfile = useStore((s) => s.setCurrentProfile);
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const pushNotification = useStore((s) => s.pushNotification);

  const weights = useCollection("weights");
  const waterLogs = useCollection("waterLogs");
  const goals = useCollection("goals");
  const groceryItems = useCollection("groceryItems");
  const recipes = useCollection("recipes");
  const notifications = useCollection("notifications");
  const today = todayISO();

  // Add member
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("adult");
  const [avatar, setAvatar] = useState("🧑");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [birthdate, setBirthdate] = useState("");

  // Grocery add
  const [groceryName, setGroceryName] = useState("");

  // Per-member quick stats
  const memberStats = useMemo(() => {
    const map: Record<
      string,
      { weight?: number; water: number; goals: number }
    > = {};
    for (const p of profiles) {
      const w = [...weights]
        .filter((x) => x.profileId === p.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const water = sum(
        waterLogs.filter((x) => x.profileId === p.id && x.date === today).map((x) => x.oz),
      );
      const goalCount = goals.filter((g) => g.profileId === p.id).length;
      map[p.id] = { weight: w?.lbs, water, goals: goalCount };
    }
    return map;
  }, [profiles, weights, waterLogs, goals, today]);

  const familyNotifications = useMemo(
    () => notifications.filter((n) => n.kind === "family"),
    [notifications],
  );

  const checkedCount = useMemo(
    () => groceryItems.filter((g) => g.checked).length,
    [groceryItems],
  );

  function saveMember() {
    if (!name.trim()) return;
    add("profiles", {
      householdId: household.id,
      name: name.trim(),
      role,
      avatar,
      color,
      birthdate: birthdate || undefined,
    });
    pushNotification({
      kind: "family",
      title: `${name.trim()} joined the household`,
    });
    setName("");
    setRole("adult");
    setAvatar("🧑");
    setColor(COLOR_SWATCHES[0]);
    setBirthdate("");
    setOpen(false);
  }

  function addGrocery() {
    if (!groceryName.trim()) return;
    add("groceryItems", {
      householdId: household.id,
      name: groceryName.trim(),
      category: "General",
      checked: false,
    });
    setGroceryName("");
  }

  function clearChecked() {
    for (const item of groceryItems.filter((g) => g.checked)) {
      remove("groceryItems", item.id);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family"
        subtitle={household.name}
        action={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <UserPlus size={16} /> Add member
          </button>
        }
      />

      {/* Members */}
      <CardPad>
        <SectionTitle
          title="Household"
          subtitle="Tap a member to switch the active profile"
          icon={<Users size={18} />}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => {
            const active = p.id === current.id;
            const age = ageFrom(p.birthdate);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentProfile(p.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-border bg-surface-muted hover:border-brand-300",
                )}
              >
                <Avatar name={p.name} emoji={p.avatar} color={p.color} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text truncate">{p.name}</span>
                    {active && <Badge color="mint">Active</Badge>}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge color={ROLE_COLOR[p.role]}>{p.role}</Badge>
                    {age != null && (
                      <span className="text-xs text-text-muted">{age} yrs</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {pets.map((pet) => (
            <div
              key={pet.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3"
            >
              <Avatar
                name={pet.name}
                emoji={pet.avatar ?? SPECIES_EMOJI[pet.species] ?? "🐾"}
                color="#94a3b8"
                size={44}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-text truncate">{pet.name}</div>
                <div className="mt-1">
                  <Badge color="gray">
                    {pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardPad>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Monitor progress */}
          <CardPad>
            <SectionTitle
              title="Monitor progress"
              subtitle="A quick glance at everyone's day"
              icon={<Heart size={18} />}
            />
            <div className="space-y-2">
              {profiles.map((p) => {
                const s = memberStats[p.id];
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-muted px-4 py-3"
                  >
                    <Avatar name={p.name} emoji={p.avatar} color={p.color} size={36} />
                    <span className="font-medium text-text">{p.name}</span>
                    <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                      <span className="text-text-muted">
                        Weight{" "}
                        <span className="font-semibold text-text">
                          {s?.weight != null ? `${s.weight} lbs` : "—"}
                        </span>
                      </span>
                      <span className="text-text-muted">
                        Water{" "}
                        <span className="font-semibold text-text">{s?.water ?? 0} oz</span>
                      </span>
                      <span className="text-text-muted">
                        Goals{" "}
                        <span className="font-semibold text-text">{s?.goals ?? 0}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardPad>

          {/* Shared grocery list */}
          <CardPad>
            <SectionTitle
              title="Shared grocery list"
              subtitle={`${groceryItems.length} items · ${checkedCount} checked`}
              icon={<ShoppingCart size={18} />}
              action={
                checkedCount > 0 ? (
                  <button className="btn-ghost" onClick={clearChecked}>
                    <Trash2 size={15} /> Clear checked
                  </button>
                ) : undefined
              }
            />

            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Add an item…"
                value={groceryName}
                onChange={(e) => setGroceryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addGrocery();
                }}
              />
              <button
                className="btn-primary shrink-0"
                onClick={addGrocery}
                disabled={!groceryName.trim()}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {groceryItems.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<ShoppingCart size={20} />}
                  title="The list is empty"
                  description="Add items above — everyone in the household shares this list."
                />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {groceryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => update("groceryItems", item.id, { checked: !item.checked })}
                      aria-label={item.checked ? "Uncheck" : "Check"}
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors",
                        item.checked
                          ? "border-mint-500 bg-mint-500 text-white"
                          : "border-border bg-surface-card text-transparent hover:border-mint-400",
                      )}
                    >
                      <Check size={14} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "text-sm",
                          item.checked
                            ? "text-text-muted line-through"
                            : "text-text",
                        )}
                      >
                        {item.name}
                        {item.qty ? ` · ${item.qty}` : ""}
                      </span>
                      <span className="ml-2 text-xs text-text-muted">{item.category}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove("groceryItems", item.id)}
                      aria-label="Remove item"
                      className="shrink-0 rounded-lg p-1.5 text-text-muted hover:text-rose-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Permissions */}
          <CardPad>
            <SectionTitle title="Roles & permissions" icon={<Users size={18} />} />
            <div className="space-y-2">
              {PERMISSIONS.map((perm) => (
                <div
                  key={perm.role}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3"
                >
                  <Badge color={perm.color}>{perm.role}</Badge>
                  <span className="text-sm text-text-muted text-right">{perm.can}</span>
                </div>
              ))}
            </div>
          </CardPad>

          {/* Shared recipes link */}
          <Link href="/recipes" className="block">
            <CardPad className="transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 shrink-0">
                  <Heart size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text">Shared recipes</h3>
                  <p className="text-sm text-text-muted">
                    {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} in your
                    family book
                  </p>
                </div>
              </div>
            </CardPad>
          </Link>

          {/* Household reminders */}
          <CardPad>
            <SectionTitle title="Household reminders" icon={<Users size={18} />} />
            {familyNotifications.length === 0 ? (
              <EmptyState
                icon={<Users size={20} />}
                title="No family reminders"
                description="Family activity and shared reminders will show up here."
              />
            ) : (
              <div className="space-y-2">
                {familyNotifications.map((n) => (
                  <div key={n.id} className="rounded-xl bg-surface-muted px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-text">{n.title}</span>
                      <span className="text-xs text-text-muted shrink-0">
                        {relativeDay(n.date)}
                      </span>
                    </div>
                    {n.body && <p className="text-sm text-text-muted mt-0.5">{n.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        </div>
      </div>

      {/* Add member modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add member"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={saveMember} disabled={!name.trim()}>
              Add member
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="e.g. Sam"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setAvatar(e)}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl border text-lg transition-colors",
                    avatar === e
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-border bg-surface-muted hover:border-brand-300",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-surface-card transition-all",
                    color === c ? "ring-text" : "ring-transparent",
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Birthdate (optional)</label>
            <input
              className="input"
              type="date"
              max={todayISO()}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
