"use client";

import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import { LineTrend } from "@/components/charts";
import { useCollection, useHousehold, usePets, useStore } from "@/lib/store";
import type { Appointment, Pet, PetFeeding, PetVaccination, Species } from "@/lib/types";
import { ageFrom, isoDaysFromNow, relativeDay, todayISO } from "@/lib/utils";
import {
  Bone,
  CalendarDays,
  Cat,
  Dog,
  PawPrint,
  Pill,
  Plus,
  Ruler,
  Stethoscope,
  Syringe,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function defaultEmoji(species: Species) {
  return species === "cat" ? "🐈" : "🐕";
}

export default function PetsPage() {
  const pets = usePets();
  const household = useHousehold();
  const petWeights = useCollection("petWeights");
  const petVaccinations = useCollection("petVaccinations");
  const petFeeding = useCollection("petFeeding");
  const appointments = useCollection("appointments");
  const medications = useCollection("medications");

  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const pushNotification = useStore((s) => s.pushNotification);

  const [selectedId, setSelectedId] = useState<string>(pets[0]?.id ?? "");
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [vaxOpen, setVaxOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [vetOpen, setVetOpen] = useState(false);

  // Reconcile the current selection when the pet list changes (add/remove).
  useEffect(() => {
    if (pets.length && !pets.some((p) => p.id === selectedId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reconciling selection with external list
      setSelectedId(pets[0].id);
    }
  }, [pets, selectedId]);

  const pet = useMemo(() => pets.find((p) => p.id === selectedId), [pets, selectedId]);

  const weights = useMemo(
    () =>
      petWeights
        .filter((w) => w.petId === selectedId)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date)),
    [petWeights, selectedId],
  );

  const vaccinations = useMemo(
    () =>
      petVaccinations
        .filter((v) => v.petId === selectedId)
        .slice()
        .sort((a, b) => (a.nextDue ?? "").localeCompare(b.nextDue ?? "")),
    [petVaccinations, selectedId],
  );

  const feedings = useMemo(
    () => petFeeding.filter((f) => f.petId === selectedId),
    [petFeeding, selectedId],
  );

  const today = todayISO();
  const vetVisits = useMemo(
    () =>
      appointments
        .filter((a) => a.forPet && a.profileId === selectedId && a.date >= today)
        .slice()
        .sort((x, y) => (x.date + (x.time ?? "")).localeCompare(y.date + (y.time ?? ""))),
    [appointments, selectedId, today],
  );

  const meds = useMemo(
    () => medications.filter((m) => m.forPet && m.profileId === selectedId),
    [medications, selectedId],
  );

  const weightSeries = useMemo(
    () => weights.map((w) => ({ label: relativeDay(w.date), value: w.lbs })),
    [weights],
  );

  const currentWeight = weights.length ? weights[weights.length - 1].lbs : pet?.weightLbs;
  const nextVax = vaccinations.find((v) => v.nextDue);

  if (pets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Pet Care"
          subtitle="Track your dogs & cats"
          action={
            <button className="btn-primary" onClick={() => setAddPetOpen(true)}>
              <Plus size={16} /> Add pet
            </button>
          }
        />
        <CardPad>
          <EmptyState
            icon={<PawPrint size={20} />}
            title="No pets yet"
            description="Add a dog or cat to track weight, vaccinations, feeding and vet visits."
            action={
              <button className="btn-outline" onClick={() => setAddPetOpen(true)}>
                <Plus size={16} /> Add pet
              </button>
            }
          />
        </CardPad>
        {addPetOpen && (
          <AddPetModal
            householdId={household.id}
            onClose={() => setAddPetOpen(false)}
            onSave={(payload) => {
              const id = add("pets", payload);
              setSelectedId(id);
              pushNotification({
                kind: "pet",
                title: `${payload.name} joined the family`,
                body: payload.breed ? `${payload.breed}` : undefined,
              });
              setAddPetOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pet Care"
        subtitle="Track your dogs & cats"
        action={
          <button className="btn-primary" onClick={() => setAddPetOpen(true)}>
            <Plus size={16} /> Add pet
          </button>
        }
      />

      {/* Pet selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {pets.map((p) => {
          const active = p.id === selectedId;
          const age = ageFrom(p.birthdate);
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`text-left rounded-2xl border p-4 transition-colors ${
                active
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-border bg-surface-card hover:bg-surface-muted"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none select-none">
                  {p.avatar ?? defaultEmoji(p.species)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">{p.name}</p>
                  <p className="text-xs text-text-muted truncate">
                    {p.species === "cat" ? "Cat" : "Dog"}
                    {p.breed ? ` · ${p.breed}` : ""}
                  </p>
                  {age != null && <p className="text-xs text-text-muted">{age} yr</p>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {pet && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Current weight"
              value={currentWeight ?? "—"}
              unit={currentWeight != null ? "lbs" : undefined}
              icon={<Ruler size={18} />}
              accent="brand"
            />
            <StatCard
              label="Next vaccine due"
              value={nextVax?.nextDue ? relativeDay(nextVax.nextDue) : "—"}
              icon={<Syringe size={18} />}
              accent="rose"
              hint={nextVax ? nextVax.name : "All up to date"}
            />
            <StatCard
              label="Next vet visit"
              value={vetVisits[0] ? relativeDay(vetVisits[0].date) : "—"}
              icon={<Stethoscope size={18} />}
              accent="mint"
              hint={vetVisits[0] ? vetVisits[0].title : "Nothing scheduled"}
            />
          </div>

          {/* Weight history */}
          <CardPad>
            <SectionTitle
              title="Weight history"
              subtitle={`${pet.name}'s weight over time`}
              icon={<Ruler size={18} />}
              action={
                <button className="btn-outline" onClick={() => setWeightOpen(true)}>
                  <Plus size={16} /> Log weight
                </button>
              }
            />
            {weights.length ? (
              <LineTrend data={weightSeries} unit="lbs" color="var(--color-brand-500)" />
            ) : (
              <EmptyState
                icon={<Ruler size={18} />}
                title="No weight logged"
                description={`Log ${pet.name}'s weight to start a trend.`}
              />
            )}
          </CardPad>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vaccinations */}
            <CardPad>
              <SectionTitle
                title="Vaccinations"
                icon={<Syringe size={18} />}
                action={
                  <button className="btn-outline" onClick={() => setVaxOpen(true)}>
                    <Plus size={16} /> Add
                  </button>
                }
              />
              {vaccinations.length ? (
                <ul className="space-y-2">
                  {vaccinations.map((v) => {
                    const soon = v.nextDue ? v.nextDue <= isoDaysFromNow(30) : false;
                    return (
                      <li
                        key={v.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-text truncate">{v.name}</p>
                          <p className="text-xs text-text-muted">Given {relativeDay(v.date)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {v.nextDue && (
                            <Badge color={soon ? "rose" : "mint"}>
                              Due {relativeDay(v.nextDue)}
                            </Badge>
                          )}
                          <button
                            className="btn-ghost px-2 py-1.5 text-text-muted"
                            aria-label="Delete"
                            onClick={() => remove("petVaccinations", v.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={<Syringe size={18} />}
                  title="No vaccinations"
                  description="Add a vaccine record with the next due date."
                />
              )}
            </CardPad>

            {/* Feeding schedule */}
            <CardPad>
              <SectionTitle
                title="Feeding schedule"
                icon={<Bone size={18} />}
                action={
                  <button className="btn-outline" onClick={() => setFeedOpen(true)}>
                    <Plus size={16} /> Add
                  </button>
                }
              />
              {feedings.length ? (
                <ul className="space-y-2">
                  {feedings.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-text truncate">{f.food}</p>
                        <p className="text-xs text-text-muted truncate">
                          {f.amount} · {f.schedule}
                        </p>
                      </div>
                      <button
                        className="btn-ghost px-2 py-1.5 text-text-muted shrink-0"
                        aria-label="Delete"
                        onClick={() => remove("petFeeding", f.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<Bone size={18} />}
                  title="No feeding plan"
                  description="Add food, amount and schedule."
                />
              )}
            </CardPad>

            {/* Vet appointments */}
            <CardPad>
              <SectionTitle
                title="Vet visits"
                icon={<Stethoscope size={18} />}
                action={
                  <button className="btn-outline" onClick={() => setVetOpen(true)}>
                    <Plus size={16} /> Add vet visit
                  </button>
                }
              />
              {vetVisits.length ? (
                <ul className="space-y-2">
                  {vetVisits.map((a) => (
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
                  title="No upcoming vet visits"
                  description="Schedule a check-up to keep your pet healthy."
                />
              )}
            </CardPad>

            {/* Medications */}
            <CardPad>
              <SectionTitle title="Medications" icon={<Pill size={18} />} />
              {meds.length ? (
                <ul className="space-y-2">
                  {meds.map((m) => (
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
                      {m.active ? (
                        <Badge color="mint">Active</Badge>
                      ) : (
                        <Badge color="gray">Inactive</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<Pill size={18} />}
                  title="No medications"
                  description="Pet medications appear here. Add them from the Medications page."
                />
              )}
            </CardPad>
          </div>

          {/* Notes */}
          <PetNotes
            key={pet.id}
            pet={pet}
            onSave={(notes) => update("pets", pet.id, { notes })}
          />
        </>
      )}

      {/* Modals */}
      {addPetOpen && (
        <AddPetModal
          householdId={household.id}
          onClose={() => setAddPetOpen(false)}
          onSave={(payload) => {
            const id = add("pets", payload);
            setSelectedId(id);
            pushNotification({
              kind: "pet",
              title: `${payload.name} joined the family`,
              body: payload.breed ? `${payload.breed}` : undefined,
            });
            setAddPetOpen(false);
          }}
        />
      )}

      {weightOpen && pet && (
        <LogWeightModal
          petName={pet.name}
          onClose={() => setWeightOpen(false)}
          onSave={(lbs) => {
            add("petWeights", { petId: pet.id, date: todayISO(), lbs });
            setWeightOpen(false);
          }}
        />
      )}

      {vaxOpen && pet && (
        <VaccinationModal
          onClose={() => setVaxOpen(false)}
          onSave={(payload) => {
            add("petVaccinations", { petId: pet.id, ...payload });
            setVaxOpen(false);
          }}
        />
      )}

      {feedOpen && pet && (
        <FeedingModal
          onClose={() => setFeedOpen(false)}
          onSave={(payload) => {
            add("petFeeding", { petId: pet.id, ...payload });
            setFeedOpen(false);
          }}
        />
      )}

      {vetOpen && pet && (
        <VetVisitModal
          petName={pet.name}
          onClose={() => setVetOpen(false)}
          onSave={(payload) => {
            add("appointments", {
              profileId: pet.id,
              forPet: true,
              type: "vet",
              ...payload,
            });
            pushNotification({
              kind: "pet",
              title: `${pet.name}'s vet visit`,
              body: `${payload.title} · ${relativeDay(payload.date)}`,
            });
            setVetOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------- Notes ----------------------------------- */
function PetNotes({ pet, onSave }: { pet: Pet; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(pet.notes ?? "");
  const dirty = notes !== (pet.notes ?? "");
  return (
    <CardPad>
      <SectionTitle title="Notes" subtitle={`Anything to remember about ${pet.name}`} icon={<PawPrint size={18} />} />
      <textarea
        className="input min-h-[96px] resize-y"
        placeholder="e.g. Loves the dog park, allergic to chicken, microchip #1234."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <button className="btn-primary" disabled={!dirty} onClick={() => onSave(notes.trim())}>
          Save notes
        </button>
      </div>
    </CardPad>
  );
}

/* ------------------------------ Add pet ---------------------------------- */
function AddPetModal({
  householdId,
  onClose,
  onSave,
}: {
  householdId: string;
  onClose: () => void;
  onSave: (payload: Omit<Pet, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("dog");
  const [breed, setBreed] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [avatar, setAvatar] = useState("🐕");
  const [avatarTouched, setAvatarTouched] = useState(false);

  function changeSpecies(s: Species) {
    setSpecies(s);
    if (!avatarTouched) setAvatar(defaultEmoji(s));
  }

  const canSave = name.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add pet"
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
                householdId,
                isPet: true,
                name: name.trim(),
                species,
                breed: breed.trim() || undefined,
                birthdate: birthdate || undefined,
                weightLbs: weightLbs ? Number(weightLbs) : undefined,
                avatar: avatar.trim() || defaultEmoji(species),
              })
            }
          >
            Add pet
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="e.g. Biscuit"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Species</label>
            <div className="inline-flex w-full rounded-xl bg-surface-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => changeSpecies("dog")}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  species === "dog" ? "bg-surface-card text-text shadow-sm" : "text-text-muted"
                }`}
              >
                <Dog size={15} /> Dog
              </button>
              <button
                type="button"
                onClick={() => changeSpecies("cat")}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  species === "cat" ? "bg-surface-card text-text shadow-sm" : "text-text-muted"
                }`}
              >
                <Cat size={15} /> Cat
              </button>
            </div>
          </div>
          <div>
            <label className="label">Avatar emoji</label>
            <input
              className="input"
              value={avatar}
              onChange={(e) => {
                setAvatar(e.target.value);
                setAvatarTouched(true);
              }}
            />
          </div>
        </div>
        <div>
          <label className="label">Breed (optional)</label>
          <input
            className="input"
            placeholder="e.g. Golden Retriever"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Birthdate (optional)</label>
            <input
              className="input"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Weight (lbs, optional)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 68"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------- Log weight ---------------------------------- */
function LogWeightModal({
  petName,
  onClose,
  onSave,
}: {
  petName: string;
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
      title={`Log weight — ${petName}`}
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
          placeholder="e.g. 68.5"
          value={lbs}
          onChange={(e) => setLbs(e.target.value)}
        />
      </div>
    </Modal>
  );
}

/* -------------------------- Vaccination ---------------------------------- */
function VaccinationModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: Omit<PetVaccination, "id" | "petId">) => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [nextDue, setNextDue] = useState("");
  const canSave = name.trim().length > 0;
  return (
    <Modal
      open
      onClose={onClose}
      title="Add vaccination"
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
              onSave({ name: name.trim(), date, nextDue: nextDue || undefined })
            }
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Vaccine name</label>
          <input
            className="input"
            placeholder="e.g. Rabies"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date given</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Next due (optional)</label>
            <input
              className="input"
              type="date"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------- Feeding ------------------------------------ */
function FeedingModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: Omit<PetFeeding, "id" | "petId">) => void;
}) {
  const [food, setFood] = useState("");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState("");
  const canSave = food.trim().length > 0;
  return (
    <Modal
      open
      onClose={onClose}
      title="Add feeding"
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
                food: food.trim(),
                amount: amount.trim() || "—",
                schedule: schedule.trim() || "—",
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
          <label className="label">Food</label>
          <input
            className="input"
            placeholder="e.g. Kibble (large breed)"
            value={food}
            onChange={(e) => setFood(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount</label>
            <input
              className="input"
              placeholder="e.g. 2 cups"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Schedule</label>
            <input
              className="input"
              placeholder="e.g. Morning & evening"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------- Vet visit ----------------------------------- */
function VetVisitModal({
  petName,
  onClose,
  onSave,
}: {
  petName: string;
  onClose: () => void;
  onSave: (payload: Pick<Appointment, "title" | "provider" | "date" | "time" | "location" | "notes">) => void;
}) {
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const canSave = title.trim().length > 0;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Add vet visit — ${petName}`}
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
        <div>
          <label className="label">Reason</label>
          <input
            className="input"
            placeholder="e.g. Annual check-up"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Vet / clinic (optional)</label>
          <input
            className="input"
            placeholder="e.g. Paws Vet"
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
            placeholder="e.g. Downtown Animal Hospital"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <input
            className="input"
            placeholder="e.g. Bring vaccine records"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
