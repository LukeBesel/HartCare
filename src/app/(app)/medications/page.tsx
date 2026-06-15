"use client";

import {
  Avatar,
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  Segmented,
  Toggle,
} from "@/components/ui";
import { useCollection, usePets, useProfiles, useStore } from "@/lib/store";
import type { Medication, Pet, Profile } from "@/lib/types";
import { isoDaysFromNow, relativeDay } from "@/lib/utils";
import {
  Bell,
  Check,
  PawPrint,
  Pencil,
  Pill,
  Plus,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

/* How many days out counts as "needs refill soon". */
const REFILL_WINDOW_DAYS = 10;

/** Resolve a friendly owner record from a medication. */
type Owner = { name: string; color: string; emoji?: string; isPet: boolean };

export default function MedicationsPage() {
  const profiles = useProfiles();
  const pets = usePets();
  const meds = useCollection("medications");

  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const pushNotification = useStore((s) => s.pushNotification);

  const [filter, setFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);

  // ---- Owner lookup -----------------------------------------------------
  const ownerFor = useMemo(() => {
    const map = new Map<string, Owner>();
    profiles.forEach((p) =>
      map.set(p.id, { name: p.name, color: p.color, emoji: p.avatar, isPet: false }),
    );
    pets.forEach((p) =>
      map.set(p.id, {
        name: p.name,
        color: "#10b981",
        emoji: p.avatar ?? "🐾",
        isPet: true,
      }),
    );
    return (m: Medication): Owner =>
      map.get(m.profileId) ?? { name: "Household", color: "#94a3b8", isPet: !!m.forPet };
  }, [profiles, pets]);

  // ---- Filter options (All / each member / Pets) ------------------------
  const filterOptions = useMemo(
    () => [
      { label: "All", value: "all" },
      ...profiles.map((p) => ({ label: p.name, value: p.id })),
      ...(pets.length ? [{ label: "Pets", value: "pets" }] : []),
    ],
    [profiles, pets],
  );

  // ---- Filtered list ----------------------------------------------------
  const visibleMeds = useMemo(() => {
    let list = meds;
    if (filter === "pets") list = meds.filter((m) => m.forPet);
    else if (filter !== "all") list = meds.filter((m) => m.profileId === filter && !m.forPet);
    return [...list].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  }, [meds, filter]);

  // ---- Refill reminders (within window, active only) --------------------
  const refillSoon = useMemo(() => {
    const cutoff = isoDaysFromNow(REFILL_WINDOW_DAYS);
    return meds.filter((m) => m.active && m.refillDate && m.refillDate <= cutoff);
  }, [meds]);

  function handleRefilled(m: Medication) {
    const next = isoDaysFromNow(30);
    update("medications", m.id, { refillDate: next });
    pushNotification({
      kind: "medication",
      title: `Refilled ${m.name}`,
      body: `Next refill ${relativeDay(next)}`,
      profileId: m.forPet ? undefined : m.profileId,
    });
  }

  function handleTaken(m: Medication) {
    pushNotification({
      kind: "medication",
      title: `Took ${m.name}`,
      body: m.dosage ? `${m.dosage} · ${m.frequency}` : m.frequency,
      profileId: m.forPet ? undefined : m.profileId,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medications"
        subtitle="Keep the whole family — and your pets — on track."
        action={
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add medication
          </button>
        }
      />

      {/* Refill reminders banner */}
      {refillSoon.length > 0 && (
        <CardPad className="border-amber-200 bg-amber-50/60 dark:bg-amber-500/5 dark:border-amber-500/20">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15">
              <Bell size={18} />
            </span>
            <div>
              <h2 className="font-semibold text-text">Refills coming up</h2>
              <p className="text-sm text-text-muted">
                {refillSoon.length} medication{refillSoon.length > 1 ? "s" : ""} need attention soon.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {refillSoon.map((m) => {
              const owner = ownerFor(m);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-card px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-text truncate">{m.name}</div>
                    <div className="text-xs text-text-muted">
                      {owner.name} · refill {m.refillDate ? relativeDay(m.refillDate) : "soon"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color="amber">Refill soon</Badge>
                    <button className="btn-outline py-2" onClick={() => handleRefilled(m)}>
                      <RefreshCw size={15} /> Refilled
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardPad>
      )}

      {/* Filter */}
      <div className="overflow-x-auto">
        <Segmented options={filterOptions} value={filter} onChange={setFilter} />
      </div>

      {/* Medication list */}
      {visibleMeds.length === 0 ? (
        <CardPad>
          <EmptyState
            icon={<Pill size={20} />}
            title="No medications yet"
            description="Add a medication to track doses, refills and reminders for your family and pets."
            action={
              <button className="btn-primary" onClick={() => setAddOpen(true)}>
                <Plus size={16} /> Add medication
              </button>
            }
          />
        </CardPad>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visibleMeds.map((m) => {
            const owner = ownerFor(m);
            return (
              <CardPad key={m.id} className={m.active ? "" : "opacity-60"}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={owner.name} emoji={owner.emoji} color={owner.color} size={40} />
                    <div className="min-w-0">
                      <div className="font-semibold text-text truncate">{m.name}</div>
                      <div className="text-sm text-text-muted truncate">
                        {m.dosage} · {m.frequency}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                        {owner.isPet ? <PawPrint size={13} /> : <User size={13} />}
                        <span className="truncate">{owner.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="btn-ghost px-2 py-2 text-text-muted"
                      aria-label={`Edit ${m.name}`}
                      onClick={() => setEditing(m)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-ghost px-2 py-2 text-text-muted"
                      aria-label={`Remove ${m.name}`}
                      onClick={() => remove("medications", m.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {m.nextDose && <Badge color="brand">Next: {m.nextDose}</Badge>}
                  {m.refillDate && (
                    <Badge color={m.refillDate <= isoDaysFromNow(REFILL_WINDOW_DAYS) ? "amber" : "gray"}>
                      Refill {relativeDay(m.refillDate)}
                    </Badge>
                  )}
                  {!m.active && <Badge color="gray">Inactive</Badge>}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <button
                    className="btn-outline py-2"
                    disabled={!m.active}
                    onClick={() => handleTaken(m)}
                  >
                    <Check size={15} /> Mark taken
                  </button>
                  <Toggle
                    checked={m.active}
                    onChange={(v) => update("medications", m.id, { active: v })}
                    label={m.active ? "Active" : "Paused"}
                  />
                </div>
              </CardPad>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {(addOpen || editing) && (
        <MedModal
          key={editing?.id ?? "new"}
          med={editing}
          profiles={profiles}
          pets={pets}
          onClose={() => {
            setAddOpen(false);
            setEditing(null);
          }}
          onSave={(payload) => {
            if (editing) {
              update("medications", editing.id, payload);
            } else {
              add("medications", { active: true, ...payload });
            }
            setAddOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ Med modal -------------------------------- */
function MedModal({
  med,
  profiles,
  pets,
  onClose,
  onSave,
}: {
  med: Medication | null;
  profiles: Profile[];
  pets: Pet[];
  onClose: () => void;
  onSave: (payload: Partial<Medication>) => void;
}) {
  const [name, setName] = useState(med?.name ?? "");
  const [dosage, setDosage] = useState(med?.dosage ?? "");
  const [frequency, setFrequency] = useState(med?.frequency ?? "");
  const [nextDose, setNextDose] = useState(med?.nextDose ?? "");
  const [refillDate, setRefillDate] = useState(med?.refillDate ?? "");
  // "for" target — defaults to first profile when adding.
  const [target, setTarget] = useState(med?.profileId ?? profiles[0]?.id ?? "");

  const canSave = name.trim().length > 0 && dosage.trim().length > 0 && frequency.trim().length > 0;

  function save() {
    if (!canSave) return;
    const isPet = pets.some((p) => p.id === target);
    onSave({
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      nextDose: nextDose.trim() || undefined,
      refillDate: refillDate || undefined,
      profileId: target,
      forPet: isPet ? true : undefined,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={med ? "Edit medication" : "Add medication"}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!canSave} onClick={save}>
            {med ? "Save changes" : "Add medication"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Medication name</label>
          <input
            className="input"
            placeholder="e.g. Lisinopril"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Dosage</label>
            <input
              className="input"
              placeholder="e.g. 10 mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Frequency</label>
            <input
              className="input"
              placeholder="e.g. Once daily"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Next dose (time)</label>
            <input
              className="input"
              placeholder="e.g. 8:00 AM"
              value={nextDose}
              onChange={(e) => setNextDose(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Refill date</label>
            <input
              className="input"
              type="date"
              value={refillDate}
              onChange={(e) => setRefillDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">For</label>
          <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
            <optgroup label="Family">
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
            {pets.length > 0 && (
              <optgroup label="Pets">
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>
    </Modal>
  );
}
