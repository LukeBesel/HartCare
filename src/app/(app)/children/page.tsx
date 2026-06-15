"use client";

import {
  Avatar,
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import { AreaTrend } from "@/components/charts";
import { useCollection, useProfiles, useStore } from "@/lib/store";
import type { Allergy, Appointment, Habit } from "@/lib/types";
import { ageFrom, relativeDay, todayISO } from "@/lib/utils";
import {
  Baby,
  CalendarDays,
  Heart,
  Pill,
  Plus,
  Ruler,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SEVERITY_COLOR: Record<Allergy["severity"], "mint" | "amber" | "rose"> = {
  mild: "mint",
  moderate: "amber",
  severe: "rose",
};

export default function ChildrenPage() {
  const profiles = useProfiles();
  const weights = useCollection("weights");
  const healthProfiles = useCollection("healthProfiles");
  const allergies = useCollection("allergies");
  const habits = useCollection("habits");
  const sleepLogs = useCollection("sleepLogs");
  const medications = useCollection("medications");
  const appointments = useCollection("appointments");

  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const pushNotification = useStore((s) => s.pushNotification);

  const children = useMemo(() => profiles.filter((p) => p.role === "child"), [profiles]);

  const [selectedId, setSelectedId] = useState<string>(children[0]?.id ?? "");
  const [weightOpen, setWeightOpen] = useState(false);
  const [allergyOpen, setAllergyOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  // Reconcile the current selection when the child list changes.
  useEffect(() => {
    if (children.length && !children.some((c) => c.id === selectedId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reconciling selection with external list
      setSelectedId(children[0].id);
    }
  }, [children, selectedId]);

  const child = useMemo(() => children.find((c) => c.id === selectedId), [children, selectedId]);
  const today = todayISO();

  const childWeights = useMemo(
    () =>
      weights
        .filter((w) => w.profileId === selectedId)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [weights, selectedId],
  );

  const weightSeries = useMemo(
    () => childWeights.map((w) => ({ label: relativeDay(w.date), value: w.lbs })),
    [childWeights],
  );

  const health = useMemo(
    () => healthProfiles.find((h) => h.profileId === selectedId),
    [healthProfiles, selectedId],
  );

  const childAllergies = useMemo(
    () => allergies.filter((a) => a.profileId === selectedId),
    [allergies, selectedId],
  );

  const childHabits = useMemo(
    () => habits.filter((h) => h.profileId === selectedId),
    [habits, selectedId],
  );

  const latestSleep = useMemo(
    () =>
      sleepLogs
        .filter((s) => s.profileId === selectedId)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))[0],
    [sleepLogs, selectedId],
  );

  const childMeds = useMemo(
    () => medications.filter((m) => !m.forPet && m.profileId === selectedId),
    [medications, selectedId],
  );

  const doctorVisits = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            !a.forPet &&
            a.profileId === selectedId &&
            (a.type === "doctor" || a.type === "dentist" || a.type === "eye" || a.type === "therapy") &&
            a.date >= today,
        )
        .slice()
        .sort((x, y) => (x.date + (x.time ?? "")).localeCompare(y.date + (y.time ?? ""))),
    [appointments, selectedId, today],
  );

  const activities = useMemo(
    () =>
      appointments
        .filter((a) => !a.forPet && a.profileId === selectedId && a.type === "other" && a.date >= today)
        .slice()
        .sort((x, y) => (x.date + (x.time ?? "")).localeCompare(y.date + (y.time ?? ""))),
    [appointments, selectedId, today],
  );

  const latestWeight = childWeights.length ? childWeights[childWeights.length - 1].lbs : undefined;

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Child Health" subtitle="Parent-controlled profiles" />
        <CardPad>
          <EmptyState
            icon={<Baby size={20} />}
            title="No child profiles yet"
            description="Add a child profile to your household to track their growth, allergies, routines and doctor visits."
          />
        </CardPad>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Child Health" subtitle="Parent-controlled profiles" />

      {/* Child selector */}
      <div className="flex flex-wrap gap-3">
        {children.map((c) => {
          const active = c.id === selectedId;
          const age = ageFrom(c.birthdate);
          return (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex items-center gap-3 rounded-2xl border p-3 pr-4 transition-colors ${
                active
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-border bg-surface-card hover:bg-surface-muted"
              }`}
            >
              <Avatar name={c.name} emoji={c.avatar} color={c.color} size={40} />
              <div className="text-left">
                <p className="font-semibold text-text">{c.name}</p>
                {age != null && <p className="text-xs text-text-muted">{age} years old</p>}
              </div>
            </button>
          );
        })}
      </div>

      {child && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Latest weight"
              value={latestWeight ?? "—"}
              unit={latestWeight != null ? "lbs" : undefined}
              icon={<Ruler size={18} />}
              accent="brand"
            />
            <StatCard
              label="Height"
              value={health?.heightCm ?? "—"}
              unit={health?.heightCm != null ? "cm" : undefined}
              icon={<Ruler size={18} />}
              accent="violet"
              hint="From health profile"
            />
            <StatCard
              label="Next doctor visit"
              value={doctorVisits[0] ? relativeDay(doctorVisits[0].date) : "—"}
              icon={<Stethoscope size={18} />}
              accent="mint"
              hint={doctorVisits[0] ? doctorVisits[0].title : "Nothing scheduled"}
            />
          </div>

          {/* Growth */}
          <CardPad>
            <SectionTitle
              title="Growth"
              subtitle={`${child.name}'s weight over time`}
              icon={<Ruler size={18} />}
              action={
                <button className="btn-outline" onClick={() => setWeightOpen(true)}>
                  <Plus size={16} /> Log weight
                </button>
              }
            />
            {childWeights.length ? (
              <AreaTrend data={weightSeries} unit="lbs" color="var(--color-brand-500)" />
            ) : (
              <EmptyState
                icon={<Ruler size={18} />}
                title="No weight logged yet"
                description={`Track ${child.name}'s growth by logging their weight.`}
              />
            )}
          </CardPad>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Doctor visits */}
            <CardPad>
              <SectionTitle title="Doctor visits" icon={<Stethoscope size={18} />} />
              {doctorVisits.length ? (
                <ul className="space-y-2">
                  {doctorVisits.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-text truncate">{a.title}</p>
                        <p className="text-xs text-text-muted truncate">
                          {a.provider ? `${a.provider} · ` : ""}
                          {relativeDay(a.date)}
                          {a.time ? ` · ${a.time}` : ""}
                        </p>
                      </div>
                      <Badge color="brand">{a.type}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<CalendarDays size={18} />}
                  title="No upcoming visits"
                  description="Schedule check-ups from the Appointments page."
                />
              )}
            </CardPad>

            {/* Medications */}
            <CardPad>
              <SectionTitle title="Medications" icon={<Pill size={18} />} />
              {childMeds.length ? (
                <ul className="space-y-2">
                  {childMeds.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-text truncate">{m.name}</p>
                        <p className="text-xs text-text-muted truncate">
                          {m.dosage} · {m.frequency}
                        </p>
                      </div>
                      <Badge color={m.active ? "mint" : "gray"}>{m.active ? "Active" : "Inactive"}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<Pill size={18} />}
                  title="No medications"
                  description="Add medications from the Medications page."
                />
              )}
            </CardPad>

            {/* Allergies */}
            <CardPad>
              <SectionTitle
                title="Allergies"
                icon={<Heart size={18} />}
                action={
                  <button className="btn-outline" onClick={() => setAllergyOpen(true)}>
                    <Plus size={16} /> Add
                  </button>
                }
              />
              {childAllergies.length ? (
                <ul className="space-y-2">
                  {childAllergies.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-text truncate">{a.name}</p>
                          <Badge color={SEVERITY_COLOR[a.severity]}>{a.severity}</Badge>
                        </div>
                        {a.reaction && <p className="text-xs text-text-muted mt-0.5">{a.reaction}</p>}
                      </div>
                      <button
                        className="btn-ghost px-2 py-1.5 text-text-muted shrink-0"
                        aria-label="Delete"
                        onClick={() => remove("allergies", a.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<Heart size={18} />}
                  title="No allergies recorded"
                  description="Keep allergy info handy for caregivers and schools."
                />
              )}
            </CardPad>

            {/* Sleep */}
            <CardPad>
              <SectionTitle title="Sleep routine" icon={<Heart size={18} />} />
              {latestSleep ? (
                <div className="rounded-xl bg-surface-muted px-4 py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-text">{latestSleep.hours}</span>
                    <span className="text-sm text-text-muted">hours</span>
                    <Badge color={latestSleep.quality >= 4 ? "mint" : latestSleep.quality >= 3 ? "amber" : "rose"}>
                      Quality {latestSleep.quality}/5
                    </Badge>
                  </div>
                  <p className="text-sm text-text-muted mt-2">
                    {latestSleep.hours >= 9
                      ? `${child.name} is getting plenty of rest. Great bedtime routine!`
                      : `A little more sleep helps ${child.name} grow strong. Aim for a calm bedtime.`}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Logged {relativeDay(latestSleep.date)}</p>
                </div>
              ) : (
                <EmptyState
                  icon={<Heart size={18} />}
                  title="No sleep logged"
                  description="Sleep logs for this child will appear here."
                />
              )}
            </CardPad>
          </div>

          {/* Daily habits */}
          <CardPad>
            <SectionTitle
              title="Daily routines"
              subtitle="Build healthy habits together"
              icon={<Heart size={18} />}
              action={
                <button className="btn-outline" onClick={() => setHabitOpen(true)}>
                  <Plus size={16} /> Add routine
                </button>
              }
            />
            {childHabits.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {childHabits.map((h) => {
                  const doneToday = h.doneDates.includes(today);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl leading-none select-none">{h.icon}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-text truncate">{h.name}</p>
                          <p className="text-xs text-text-muted">
                            {h.target} · 🔥 {h.streak} day streak
                          </p>
                        </div>
                      </div>
                      <button
                        className={doneToday ? "btn-primary shrink-0" : "btn-outline shrink-0"}
                        onClick={() => {
                          if (doneToday) {
                            update("habits", h.id, {
                              doneDates: h.doneDates.filter((d) => d !== today),
                              streak: Math.max(0, h.streak - 1),
                            });
                          } else {
                            update("habits", h.id, {
                              doneDates: [today, ...h.doneDates],
                              streak: h.streak + 1,
                            });
                          }
                        }}
                      >
                        {doneToday ? "Done today" : "Mark done"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Heart size={18} />}
                title="No routines yet"
                description={`Add a daily routine to help ${child.name} build healthy habits.`}
              />
            )}
          </CardPad>

          {/* Activities / sports */}
          <CardPad>
            <SectionTitle
              title="Activities & sports"
              subtitle="Practices, games and clubs"
              icon={<CalendarDays size={18} />}
              action={
                <button className="btn-outline" onClick={() => setActivityOpen(true)}>
                  <Plus size={16} /> Add activity
                </button>
              }
            />
            {activities.length ? (
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-text truncate">{a.title}</p>
                      <p className="text-xs text-text-muted truncate">
                        {a.provider ? `${a.provider} · ` : ""}
                        {relativeDay(a.date)}
                        {a.time ? ` · ${a.time}` : ""}
                        {a.location ? ` · ${a.location}` : ""}
                      </p>
                    </div>
                    <button
                      className="btn-ghost px-2 py-1.5 text-text-muted shrink-0"
                      aria-label="Delete"
                      onClick={() => remove("appointments", a.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<CalendarDays size={18} />}
                title="No activities scheduled"
                description="Add soccer practice, music lessons and more."
              />
            )}
          </CardPad>
        </>
      )}

      {/* Modals */}
      {weightOpen && child && (
        <LogWeightModal
          childName={child.name}
          onClose={() => setWeightOpen(false)}
          onSave={(lbs) => {
            add("weights", { profileId: child.id, date: todayISO(), lbs });
            setWeightOpen(false);
          }}
        />
      )}

      {allergyOpen && child && (
        <AllergyModal
          onClose={() => setAllergyOpen(false)}
          onSave={(payload) => {
            add("allergies", { profileId: child.id, ...payload });
            setAllergyOpen(false);
          }}
        />
      )}

      {habitOpen && child && (
        <HabitModal
          onClose={() => setHabitOpen(false)}
          onSave={(payload) => {
            add("habits", {
              profileId: child.id,
              streak: 0,
              doneDates: [],
              ...payload,
            });
            setHabitOpen(false);
          }}
        />
      )}

      {activityOpen && child && (
        <ActivityModal
          childName={child.name}
          onClose={() => setActivityOpen(false)}
          onSave={(payload) => {
            add("appointments", {
              profileId: child.id,
              type: "other",
              provider: "Sports",
              ...payload,
            });
            pushNotification({
              kind: "family",
              title: `${child.name}: ${payload.title}`,
              body: relativeDay(payload.date),
              profileId: child.id,
            });
            setActivityOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* --------------------------- Log weight ---------------------------------- */
function LogWeightModal({
  childName,
  onClose,
  onSave,
}: {
  childName: string;
  onClose: () => void;
  onSave: (lbs: number) => void;
}) {
  const [lbs, setLbs] = useState("");
  const value = Number(lbs);
  const canSave = lbs !== "" && !Number.isNaN(value) && value > 0;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Log weight — ${childName}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!canSave} onClick={() => canSave && onSave(value)}>
            Save
          </button>
        </>
      }
    >
      <div>
        <label className="label">Weight (lbs)</label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.1"
          autoFocus
          placeholder="e.g. 62"
          value={lbs}
          onChange={(e) => setLbs(e.target.value)}
        />
      </div>
    </Modal>
  );
}

/* ---------------------------- Allergy ------------------------------------ */
function AllergyModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: Omit<Allergy, "id" | "profileId">) => void;
}) {
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<Allergy["severity"]>("mild");
  const [reaction, setReaction] = useState("");
  const canSave = name.trim().length > 0;
  return (
    <Modal
      open
      onClose={onClose}
      title="Add allergy"
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
              onSave({ name: name.trim(), severity, reaction: reaction.trim() || undefined })
            }
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Allergen</label>
          <input
            className="input"
            placeholder="e.g. Peanuts"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Severity</label>
          <select
            className="input"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Allergy["severity"])}
          >
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div>
          <label className="label">Reaction (optional)</label>
          <input
            className="input"
            placeholder="e.g. Hives, carries EpiPen"
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ----------------------------- Habit ------------------------------------- */
function HabitModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: Pick<Habit, "name" | "icon" | "target">) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [target, setTarget] = useState("Daily");
  const canSave = name.trim().length > 0;
  return (
    <Modal
      open
      onClose={onClose}
      title="Add routine"
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
              onSave({ name: name.trim(), icon: icon.trim() || "⭐", target: target.trim() || "Daily" })
            }
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="label">Routine</label>
            <input
              className="input"
              placeholder="e.g. Brush teeth"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Icon</label>
            <input
              className="input w-20 text-center"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Target</label>
          <input
            className="input"
            placeholder="e.g. Daily, 3x/week"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------- Activity ----------------------------------- */
function ActivityModal({
  childName,
  onClose,
  onSave,
}: {
  childName: string;
  onClose: () => void;
  onSave: (payload: Pick<Appointment, "title" | "date" | "time" | "location" | "notes">) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const canSave = title.trim().length > 0;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Add activity — ${childName}`}
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
                title: title.trim(),
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
        <div>
          <label className="label">Activity</label>
          <input
            className="input"
            placeholder="e.g. Soccer practice"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            placeholder="e.g. Community Field"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input
            className="input"
            placeholder="e.g. Bring water and cleats"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
