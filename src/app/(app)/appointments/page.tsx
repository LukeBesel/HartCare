"use client";

import {
  Avatar,
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
  Segmented,
  StatCard,
} from "@/components/ui";
import { useCollection, usePets, useProfiles, useStore } from "@/lib/store";
import type { Appointment, Pet, Profile } from "@/lib/types";
import { isoDaysFromNow, relativeDay, todayISO } from "@/lib/utils";
import {
  Brain,
  CalendarDays,
  Clock,
  Eye,
  MapPin,
  PawPrint,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type ApptType = Appointment["type"];

const TYPE_META: Record<
  ApptType,
  { label: string; color: "brand" | "mint" | "amber" | "rose" | "violet" | "gray"; icon: ReactNode }
> = {
  doctor: { label: "Doctor", color: "brand", icon: <Stethoscope size={16} /> },
  dentist: { label: "Dentist", color: "mint", icon: <Stethoscope size={16} /> },
  eye: { label: "Eye", color: "violet", icon: <Eye size={16} /> },
  therapy: { label: "Therapy", color: "amber", icon: <Brain size={16} /> },
  vet: { label: "Vet", color: "rose", icon: <PawPrint size={16} /> },
  other: { label: "Other", color: "gray", icon: <CalendarDays size={16} /> },
};

type Owner = { id: string; name: string; emoji?: string; color: string; isPet: boolean };

type ApptFilter = "all" | "upcoming" | "past";

export default function AppointmentsPage() {
  const appointments = useCollection("appointments");
  const profiles = useProfiles();
  const pets = usePets();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const pushNotification = useStore((s) => s.pushNotification);

  const [filter, setFilter] = useState<ApptFilter>("all");
  const [who, setWho] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  // Owner lookup map (profiles + pets)
  const owners = useMemo<Record<string, Owner>>(() => {
    const map: Record<string, Owner> = {};
    for (const p of profiles) {
      map[p.id] = { id: p.id, name: p.name, emoji: p.avatar, color: p.color, isPet: false };
    }
    for (const pet of pets) {
      map[pet.id] = {
        id: pet.id,
        name: pet.name,
        emoji: pet.avatar ?? (pet.species === "cat" ? "🐈" : "🐕"),
        color: "#10b981",
        isPet: true,
      };
    }
    return map;
  }, [profiles, pets]);

  const today = todayISO();

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (who !== "all" && a.profileId !== who) return false;
      if (filter === "upcoming" && a.date < today) return false;
      if (filter === "past" && a.date >= today) return false;
      return true;
    });
  }, [appointments, who, filter, today]);

  const upcoming = useMemo(
    () =>
      filtered
        .filter((a) => a.date >= today)
        .slice()
        .sort((x, y) => (x.date + (x.time ?? "")).localeCompare(y.date + (y.time ?? ""))),
    [filtered, today],
  );

  const past = useMemo(
    () =>
      filtered
        .filter((a) => a.date < today)
        .slice()
        .sort((x, y) => (y.date + (y.time ?? "")).localeCompare(x.date + (x.time ?? ""))),
    [filtered, today],
  );

  const weekEnd = isoDaysFromNow(7);
  const upcomingThisWeek = useMemo(
    () => appointments.filter((a) => a.date >= today && a.date <= weekEnd).length,
    [appointments, today, weekEnd],
  );

  const nextAppt = useMemo(
    () =>
      appointments
        .filter((a) => a.date >= today)
        .slice()
        .sort((x, y) => (x.date + (x.time ?? "")).localeCompare(y.date + (y.time ?? "")))[0],
    [appointments, today],
  );

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(a: Appointment) {
    setEditing(a);
    setModalOpen(true);
  }

  function handleSave(payload: Omit<Appointment, "id">) {
    if (editing) {
      update("appointments", editing.id, payload);
    } else {
      add("appointments", payload);
      pushNotification({
        kind: "appointment",
        title: "Appointment added",
        body: `${payload.title} · ${relativeDay(payload.date)}`,
        profileId: payload.forPet ? undefined : payload.profileId,
      });
    }
    setModalOpen(false);
    setEditing(null);
  }

  const whoOptions = useMemo(
    () => [
      { label: "Everyone", value: "all" },
      ...profiles.map((p) => ({ label: p.name, value: p.id })),
      ...pets.map((p) => ({ label: p.name, value: p.id })),
    ],
    [profiles, pets],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        subtitle="Visits and check-ups for your whole family"
        action={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add appointment
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Upcoming this week"
          value={upcomingThisWeek}
          unit={upcomingThisWeek === 1 ? "visit" : "visits"}
          icon={<CalendarDays size={18} />}
          accent="brand"
        />
        <StatCard
          label="Next appointment"
          value={nextAppt ? nextAppt.title : "—"}
          icon={<Clock size={18} />}
          accent="mint"
          hint={
            nextAppt
              ? `${relativeDay(nextAppt.date)}${nextAppt.time ? ` · ${nextAppt.time}` : ""}`
              : "Nothing scheduled"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          options={[
            { label: "All", value: "all" },
            { label: "Upcoming", value: "upcoming" },
            { label: "Past", value: "past" },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <select className="input max-w-[200px]" value={who} onChange={(e) => setWho(e.target.value)}>
          {whoOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <CardPad>
          <EmptyState
            icon={<CalendarDays size={20} />}
            title="No appointments"
            description="Add a doctor, dentist, vet or other visit to keep the family on schedule."
            action={
              <button className="btn-outline" onClick={openAdd}>
                <Plus size={16} /> Add appointment
              </button>
            }
          />
        </CardPad>
      ) : (
        <div className="space-y-6">
          {filter !== "past" && upcoming.length > 0 && (
            <section>
              <SectionTitle title="Upcoming" subtitle={`${upcoming.length} scheduled`} icon={<CalendarDays size={18} />} />
              <div className="grid gap-3">
                {upcoming.map((a) => (
                  <ApptCard
                    key={a.id}
                    appt={a}
                    owner={owners[a.profileId]}
                    onEdit={() => openEdit(a)}
                    onDelete={() => remove("appointments", a.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {filter !== "upcoming" && past.length > 0 && (
            <section>
              <SectionTitle title="Past" subtitle={`${past.length} completed`} icon={<Clock size={18} />} />
              <div className="grid gap-3">
                {past.map((a) => (
                  <ApptCard
                    key={a.id}
                    appt={a}
                    owner={owners[a.profileId]}
                    muted
                    onEdit={() => openEdit(a)}
                    onDelete={() => remove("appointments", a.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {modalOpen && (
        <ApptModal
          appt={editing}
          profiles={profiles}
          pets={pets}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

/* ------------------------------ Appt card -------------------------------- */
function ApptCard({
  appt,
  owner,
  muted,
  onEdit,
  onDelete,
}: {
  appt: Appointment;
  owner?: Owner;
  muted?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[appt.type];
  return (
    <CardPad className={muted ? "opacity-80" : undefined}>
      <div className="flex items-start gap-4">
        <span className="grid place-items-center h-10 w-10 rounded-xl bg-surface-muted text-brand-600 shrink-0">
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text truncate">{appt.title}</h3>
            <Badge color={meta.color}>{meta.label}</Badge>
          </div>
          {appt.provider && <p className="text-sm text-text-muted mt-0.5">{appt.provider}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-muted">
            {owner && (
              <span className="flex items-center gap-1.5">
                <Avatar name={owner.name} emoji={owner.emoji} color={owner.color} size={22} />
                <span className="text-text">{owner.name}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {relativeDay(appt.date)}
              {appt.time ? ` · ${appt.time}` : ""}
            </span>
            {appt.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {appt.location}
              </span>
            )}
          </div>

          {appt.notes && <p className="mt-2 text-sm text-text-muted">{appt.notes}</p>}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="btn-ghost px-2 py-2 text-text-muted" aria-label="Edit" onClick={onEdit}>
            <Pencil size={15} />
          </button>
          <button className="btn-ghost px-2 py-2 text-text-muted" aria-label="Delete" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </CardPad>
  );
}

/* ------------------------------ Appt modal ------------------------------- */
function ApptModal({
  appt,
  profiles,
  pets,
  onClose,
  onSave,
}: {
  appt: Appointment | null;
  profiles: Profile[];
  pets: Pet[];
  onClose: () => void;
  onSave: (payload: Omit<Appointment, "id">) => void;
}) {
  const initialWho = appt ? appt.profileId : profiles[0]?.id ?? "";
  const [type, setType] = useState<ApptType>(appt?.type ?? "doctor");
  const [title, setTitle] = useState(appt?.title ?? "");
  const [provider, setProvider] = useState(appt?.provider ?? "");
  const [date, setDate] = useState(appt?.date ?? todayISO());
  const [time, setTime] = useState(appt?.time ?? "");
  const [location, setLocation] = useState(appt?.location ?? "");
  const [notes, setNotes] = useState(appt?.notes ?? "");
  const [whoId, setWhoId] = useState(initialWho);

  const canSave = title.trim().length > 0 && whoId.length > 0;
  const isPet = pets.some((p) => p.id === whoId);

  return (
    <Modal
      open
      onClose={onClose}
      title={appt ? "Edit appointment" : "Add appointment"}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!canSave}
            onClick={() =>
              canSave &&
              onSave({
                profileId: whoId,
                forPet: isPet ? true : undefined,
                type,
                title: title.trim(),
                provider: provider.trim() || undefined,
                date,
                time: time.trim() || undefined,
                location: location.trim() || undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as ApptType)}>
              <option value="doctor">Doctor</option>
              <option value="dentist">Dentist</option>
              <option value="eye">Eye</option>
              <option value="therapy">Therapy</option>
              <option value="vet">Vet</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">For</label>
            <select className="input" value={whoId} onChange={(e) => setWhoId(e.target.value)}>
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

        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="e.g. Annual check-up"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Provider (optional)</label>
          <input
            className="input"
            placeholder="e.g. Dr. Rivera"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Time (optional)</label>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Location (optional)</label>
          <input
            className="input"
            placeholder="e.g. Downtown Clinic"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <input
            className="input"
            placeholder="e.g. Bring insurance card"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
