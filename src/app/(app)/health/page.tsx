"use client";

import { AreaTrend, LineTrend, type Point } from "@/components/charts";
import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
  Segmented,
  StatCard,
} from "@/components/ui";
import { useProfileRows } from "@/lib/hooks";
import { useCollection, useCurrentProfile, useStore } from "@/lib/store";
import type { Allergy, Vital } from "@/lib/types";
import { round, todayISO } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Droplet,
  HeartPulse,
  Pill,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/* Vital metric picker config */
type VitalMetric = "blood_pressure" | "heart_rate" | "blood_sugar" | "cholesterol";

const METRIC_OPTIONS: { label: string; value: VitalMetric }[] = [
  { label: "Blood pressure", value: "blood_pressure" },
  { label: "Heart rate", value: "heart_rate" },
  { label: "Blood sugar", value: "blood_sugar" },
  { label: "Cholesterol", value: "cholesterol" },
];

const METRIC_META: Record<
  VitalMetric,
  { unit: string; color: string; needsValue2: boolean; valueLabel: string }
> = {
  blood_pressure: {
    unit: "mmHg",
    color: "var(--color-brand-500)",
    needsValue2: true,
    valueLabel: "Systolic",
  },
  heart_rate: { unit: "bpm", color: "#f43f5e", needsValue2: false, valueLabel: "Heart rate" },
  blood_sugar: { unit: "mg/dL", color: "#38bdf8", needsValue2: false, valueLabel: "Blood sugar" },
  cholesterol: { unit: "mg/dL", color: "#a855f7", needsValue2: false, valueLabel: "Total" },
};

const SEVERITY_COLOR: Record<Allergy["severity"], "rose" | "amber" | "gray"> = {
  severe: "rose",
  moderate: "amber",
  mild: "gray",
};

function cmToFtIn(cm: number): string {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}'${inch}"`;
}

export default function HealthPage() {
  const profile = useCurrentProfile();
  const add = useStore((s) => s.add);
  const remove = useStore((s) => s.remove);

  const vitals = useProfileRows("vitals");
  const weights = useProfileRows("weights");
  const allergies = useProfileRows("allergies");
  const conditions = useProfileRows("conditions");
  const healthProfiles = useCollection("healthProfiles");
  const allMeds = useCollection("medications");

  const [metric, setMetric] = useState<VitalMetric>("blood_pressure");
  const [vitalOpen, setVitalOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [allergyOpen, setAllergyOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);

  // ---- Health profile (height, blood type, resting HR) -----------------
  const healthProfile = useMemo(
    () => healthProfiles.find((h) => h.profileId === profile.id),
    [healthProfiles, profile.id],
  );

  const latestWeight = useMemo(
    () => [...weights].sort((a, b) => b.date.localeCompare(a.date))[0],
    [weights],
  );

  const latestBodyFat = useMemo(() => {
    const withBf = [...weights]
      .filter((w) => w.bodyFat != null)
      .sort((a, b) => b.date.localeCompare(a.date));
    return withBf[0]?.bodyFat;
  }, [weights]);

  // ---- Vitals series for selected metric -------------------------------
  const vitalSeries = useMemo<Point[]>(
    () =>
      vitals
        .filter((v) => v.type === metric)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((v) => ({ label: v.date.slice(5), value: v.value })),
    [vitals, metric],
  );

  const diastolicSeries = useMemo<Point[]>(
    () =>
      metric === "blood_pressure"
        ? vitals
            .filter((v) => v.type === "blood_pressure" && v.value2 != null)
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((v) => ({ label: v.date.slice(5), value: v.value2 as number }))
        : [],
    [vitals, metric],
  );

  const latestBp = useMemo(
    () =>
      [...vitals]
        .filter((v) => v.type === "blood_pressure")
        .sort((a, b) => b.date.localeCompare(a.date))[0],
    [vitals],
  );

  // ---- Weight series ----------------------------------------------------
  const weightSeries = useMemo<Point[]>(
    () =>
      [...weights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-21)
        .map((w) => ({ label: w.date.slice(5), value: w.lbs })),
    [weights],
  );

  // ---- Active meds for this profile ------------------------------------
  const myMeds = useMemo(
    () => allMeds.filter((m) => m.profileId === profile.id && m.active && !m.forPet),
    [allMeds, profile.id],
  );

  const meta = METRIC_META[metric];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Records"
        subtitle={`Medical overview for ${profile.name}`}
      />
      <p className="-mt-3 text-xs text-text-muted flex items-center gap-1.5">
        <AlertTriangle size={13} className="shrink-0" />
        HartCare provides wellness information, not medical advice.
      </p>

      {/* Profile vitals summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Height"
          value={healthProfile?.heightCm ? cmToFtIn(healthProfile.heightCm) : "—"}
          unit={healthProfile?.heightCm ? `${healthProfile.heightCm} cm` : undefined}
          icon={<Ruler size={18} />}
          accent="brand"
        />
        <StatCard
          label="Latest weight"
          value={latestWeight ? latestWeight.lbs : "—"}
          unit={latestWeight ? "lbs" : undefined}
          icon={<Activity size={18} />}
          accent="mint"
          hint={latestBodyFat != null ? `${latestBodyFat}% body fat` : undefined}
        />
        <StatCard
          label="Resting HR"
          value={healthProfile?.restingHeartRate ?? "—"}
          unit={healthProfile?.restingHeartRate ? "bpm" : undefined}
          icon={<HeartPulse size={18} />}
          accent="rose"
        />
        <StatCard
          label="Blood type"
          value={healthProfile?.bloodType ?? "—"}
          icon={<Droplet size={18} />}
          accent="violet"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vitals trends */}
        <CardPad className="lg:col-span-2">
          <SectionTitle
            title="Vitals trends"
            subtitle="Track your readings over time"
            icon={<HeartPulse size={18} />}
            action={
              <button className="btn-primary py-2" onClick={() => setVitalOpen(true)}>
                <Plus size={16} /> Add reading
              </button>
            }
          />
          <div className="mb-4 overflow-x-auto">
            <Segmented options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
          </div>
          {vitalSeries.length > 1 ? (
            <>
              {metric === "blood_pressure" ? (
                <LineTrend data={vitalSeries} unit={meta.unit} color={meta.color} />
              ) : (
                <AreaTrend data={vitalSeries} unit={meta.unit} color={meta.color} />
              )}
              {metric === "blood_pressure" && latestBp && (
                <p className="mt-3 text-sm text-text-muted">
                  Latest: <span className="text-text font-medium">{latestBp.value}/{latestBp.value2}</span> mmHg
                  {diastolicSeries.length > 0 && " · chart shows systolic"}
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon={<HeartPulse size={20} />}
              title="Not enough readings"
              description="Add a couple of readings for this metric to see a trend."
              action={
                <button className="btn-outline" onClick={() => setVitalOpen(true)}>
                  <Plus size={16} /> Add reading
                </button>
              }
            />
          )}
        </CardPad>

        {/* Weight & body */}
        <CardPad>
          <SectionTitle
            title="Weight & body"
            subtitle="Your weigh-in history"
            icon={<Activity size={18} />}
            action={
              <button
                className="text-sm text-brand-600 hover:underline"
                onClick={() => setWeightOpen(true)}
              >
                Log weight
              </button>
            }
          />
          {weightSeries.length > 1 ? (
            <>
              <AreaTrend data={weightSeries} unit="lbs" height={180} color="var(--color-mint-500)" />
              {latestBodyFat != null && (
                <p className="mt-3 text-sm text-text-muted">
                  Latest body fat: <span className="text-text font-medium">{latestBodyFat}%</span>
                </p>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Activity size={20} />}
              title="No weigh-ins yet"
              description="Log a weight to start tracking your trend."
              action={
                <button className="btn-outline" onClick={() => setWeightOpen(true)}>
                  <Plus size={16} /> Log weight
                </button>
              }
            />
          )}
        </CardPad>

        {/* Medications summary */}
        <CardPad>
          <SectionTitle
            title="Medications"
            subtitle="Active prescriptions"
            icon={<Pill size={18} />}
            action={
              <Link href="/medications" className="text-sm text-brand-600 hover:underline">
                Manage
              </Link>
            }
          />
          {myMeds.length === 0 ? (
            <EmptyState
              icon={<Pill size={20} />}
              title="No active medications"
              description="Medications you add will appear here."
              action={
                <Link href="/medications" className="btn-outline">
                  <Pill size={16} /> Go to medications
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {myMeds.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-text truncate">{m.name}</div>
                    <div className="text-xs text-text-muted">
                      {m.dosage} · {m.frequency}
                    </div>
                  </div>
                  {m.nextDose && (
                    <Badge color="brand" className="shrink-0">
                      {m.nextDose}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardPad>

        {/* Allergies */}
        <CardPad>
          <SectionTitle
            title="Allergies"
            subtitle="Known sensitivities"
            icon={<AlertTriangle size={18} />}
            action={
              <button
                className="text-sm text-brand-600 hover:underline"
                onClick={() => setAllergyOpen(true)}
              >
                Add
              </button>
            }
          />
          {allergies.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle size={20} />}
              title="No allergies recorded"
              description="Keep allergy info handy for caregivers and providers."
              action={
                <button className="btn-outline" onClick={() => setAllergyOpen(true)}>
                  <Plus size={16} /> Add allergy
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {allergies.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text truncate">{a.name}</span>
                      <Badge color={SEVERITY_COLOR[a.severity]} className="capitalize shrink-0">
                        {a.severity}
                      </Badge>
                    </div>
                    {a.reaction && (
                      <div className="text-xs text-text-muted mt-1">{a.reaction}</div>
                    )}
                  </div>
                  <button
                    className="btn-ghost px-2 py-2 text-text-muted shrink-0"
                    aria-label={`Remove ${a.name}`}
                    onClick={() => remove("allergies", a.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardPad>

        {/* Conditions */}
        <CardPad>
          <SectionTitle
            title="Conditions"
            subtitle="Ongoing health conditions"
            icon={<ClipboardList size={18} />}
            action={
              <button
                className="text-sm text-brand-600 hover:underline"
                onClick={() => setConditionOpen(true)}
              >
                Add
              </button>
            }
          />
          {conditions.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={20} />}
              title="No conditions recorded"
              description="Add conditions to keep a complete health picture."
              action={
                <button className="btn-outline" onClick={() => setConditionOpen(true)}>
                  <Plus size={16} /> Add condition
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {conditions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-surface-muted px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text truncate">{c.name}</span>
                      {c.since && (
                        <span className="text-xs text-text-muted shrink-0">since {c.since}</span>
                      )}
                    </div>
                    {c.notes && <div className="text-xs text-text-muted mt-1">{c.notes}</div>}
                  </div>
                  <button
                    className="btn-ghost px-2 py-2 text-text-muted shrink-0"
                    aria-label={`Remove ${c.name}`}
                    onClick={() => remove("conditions", c.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardPad>
      </div>

      {/* ---------------------------- Modals ---------------------------- */}
      {vitalOpen && (
        <VitalModal
          onClose={() => setVitalOpen(false)}
          onSave={(payload) => {
            add("vitals", { profileId: profile.id, ...payload });
            setVitalOpen(false);
          }}
        />
      )}

      {weightOpen && (
        <WeightModal
          onClose={() => setWeightOpen(false)}
          onSave={(lbs, bodyFat, date) => {
            add("weights", { profileId: profile.id, date, lbs, bodyFat });
            setWeightOpen(false);
          }}
        />
      )}

      {allergyOpen && (
        <AllergyModal
          onClose={() => setAllergyOpen(false)}
          onSave={(name, severity, reaction) => {
            add("allergies", { profileId: profile.id, name, severity, reaction });
            setAllergyOpen(false);
          }}
        />
      )}

      {conditionOpen && (
        <ConditionModal
          onClose={() => setConditionOpen(false)}
          onSave={(name, since, notes) => {
            add("conditions", { profileId: profile.id, name, since, notes });
            setConditionOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ----------------------------- Vital modal ------------------------------- */
function VitalModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: Omit<Vital, "id" | "profileId">) => void;
}) {
  const [type, setType] = useState<Vital["type"]>("blood_pressure");
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const [unit, setUnit] = useState("mmHg");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const isBp = type === "blood_pressure";
  const isLab = type === "lab";

  // Auto-suggest a unit when the type changes.
  function changeType(t: Vital["type"]) {
    setType(t);
    const units: Record<Vital["type"], string> = {
      blood_pressure: "mmHg",
      heart_rate: "bpm",
      blood_sugar: "mg/dL",
      cholesterol: "mg/dL",
      temperature: "°F",
      oxygen: "%",
      lab: "",
    };
    setUnit(units[t]);
  }

  const canSave = value.trim().length > 0 && (!isBp || value2.trim().length > 0);

  return (
    <Modal
      open
      onClose={onClose}
      title="Add reading"
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
                type,
                value: round(Number(value), 1),
                value2: isBp && value2 ? round(Number(value2), 1) : undefined,
                unit,
                label: isLab && label.trim() ? label.trim() : undefined,
                note: note.trim() || undefined,
                date,
              })
            }
          >
            Save reading
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => changeType(e.target.value as Vital["type"])}
          >
            <option value="blood_pressure">Blood pressure</option>
            <option value="heart_rate">Heart rate</option>
            <option value="blood_sugar">Blood sugar</option>
            <option value="cholesterol">Cholesterol</option>
            <option value="temperature">Temperature</option>
            <option value="oxygen">Oxygen (SpO₂)</option>
            <option value="lab">Lab result</option>
          </select>
        </div>

        {isLab && (
          <div>
            <label className="label">Lab label</label>
            <input
              className="input"
              placeholder="e.g. LDL, HbA1c"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{isBp ? "Systolic" : "Value"}</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          {isBp ? (
            <div>
              <label className="label">Diastolic</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min={0}
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="label">Unit</label>
              <input
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          )}
        </div>

        {isBp && (
          <div>
            <label className="label">Unit</label>
            <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        )}

        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <input
            className="input"
            placeholder="e.g. measured after walking"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ----------------------------- Weight modal ------------------------------ */
function WeightModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (lbs: number, bodyFat: number | undefined, date: string) => void;
}) {
  const [lbs, setLbs] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [date, setDate] = useState(todayISO());

  const canSave = lbs.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Log weight"
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
              onSave(round(Number(lbs), 1), bodyFat.trim() ? round(Number(bodyFat), 1) : undefined, date)
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
            <label className="label">Weight (lbs)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min={0}
              value={lbs}
              onChange={(e) => setLbs(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Body fat % (optional)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min={0}
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------- Allergy modal ------------------------------ */
function AllergyModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string, severity: Allergy["severity"], reaction: string | undefined) => void;
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
            onClick={() => canSave && onSave(name.trim(), severity, reaction.trim() || undefined)}
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
            placeholder="e.g. Peanuts, Penicillin"
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
            placeholder="e.g. Hives, anaphylaxis"
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------- Condition modal ----------------------------- */
function ConditionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string, since: string | undefined, notes: string | undefined) => void;
}) {
  const [name, setName] = useState("");
  const [since, setSince] = useState("");
  const [notes, setNotes] = useState("");

  const canSave = name.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add condition"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!canSave}
            onClick={() =>
              canSave && onSave(name.trim(), since.trim() || undefined, notes.trim() || undefined)
            }
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Condition</label>
          <input
            className="input"
            placeholder="e.g. Hypertension, Asthma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Since (optional)</label>
          <input
            className="input"
            placeholder="e.g. 2019"
            value={since}
            onChange={(e) => setSince(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input
            className="input"
            placeholder="e.g. Well-managed with medication"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
