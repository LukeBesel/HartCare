"use client";

import {
  Avatar,
  Badge,
  CardPad,
  Modal,
  PageHeader,
  SectionTitle,
  Segmented,
  Toggle,
} from "@/components/ui";
import { AppearanceStudio } from "@/components/appearance/AppearanceStudio";
import { useCurrentProfile, useSettings, useStore } from "@/lib/store";
import { Bell, Monitor, Ruler, Shield, Trash2, User } from "lucide-react";
import { useState } from "react";

const AVATAR_OPTIONS = ["🧔", "👩", "🧒", "👵", "👨", "👧", "🧑", "👴", "🐱", "🐶"];
const COLOR_OPTIONS = ["#2a59d6", "#15ad76", "#f59e0b", "#a855f7", "#f43f5e", "#38bdf8"];

const UNIT_OPTIONS: { label: string; value: "imperial" | "metric" }[] = [
  { label: "Imperial", value: "imperial" },
  { label: "Metric", value: "metric" },
];

const NOTIFICATION_CATEGORIES: { key: string; label: string }[] = [
  { key: "medication", label: "Medication reminders" },
  { key: "appointment", label: "Appointment reminders" },
  { key: "water", label: "Water reminders" },
  { key: "family", label: "Family reminders" },
];

export default function SettingsPage() {
  const profile = useCurrentProfile();
  const settings = useSettings();
  const update = useStore((s) => s.update);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemo = useStore((s) => s.resetDemo);

  const [resetOpen, setResetOpen] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c.key, true])),
  );

  function patchProfile(patch: Partial<typeof profile>) {
    update("profiles", profile.id, patch);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Personalize HartCare for your household." />

      {/* Profile */}
      <CardPad>
        <SectionTitle title="Profile" subtitle="Edit your details" icon={<User size={18} />} />
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <Avatar name={profile.name} emoji={profile.avatar} color={profile.color} size={72} />
            <Badge color="gray">{profile.role}</Badge>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={profile.name}
                onChange={(e) => patchProfile({ name: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => patchProfile({ avatar: emoji })}
                    className={
                      profile.avatar === emoji
                        ? "grid place-items-center h-10 w-10 rounded-xl text-lg ring-2 ring-brand-500 bg-surface-muted"
                        : "grid place-items-center h-10 w-10 rounded-xl text-lg bg-surface-muted hover:ring-2 hover:ring-border"
                    }
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => patchProfile({ color })}
                    className={
                      profile.color === color
                        ? "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-surface-card ring-text"
                        : "h-9 w-9 rounded-full"
                    }
                    style={{ background: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="label">Birthdate</label>
              <input
                className="input"
                type="date"
                value={profile.birthdate ?? ""}
                onChange={(e) => patchProfile({ birthdate: e.target.value || undefined })}
              />
            </div>
          </div>
        </div>
      </CardPad>

      {/* Appearance Studio */}
      <AppearanceStudio />

      {/* Units */}
      <CardPad>
        <SectionTitle
          title="Units"
          subtitle="Measurement system"
          icon={<Ruler size={18} />}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-text">
            <Ruler size={16} className="text-text-muted" />
            <span className="font-medium">Measurement units</span>
          </div>
          <Segmented
            options={UNIT_OPTIONS}
            value={settings.units}
            onChange={(units) => updateSettings({ units })}
          />
        </div>
      </CardPad>

      {/* Goals & targets */}
      <CardPad>
        <SectionTitle
          title="Goals & targets"
          subtitle="Your daily wellness targets"
          icon={<Monitor size={18} />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Water goal (oz)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={settings.waterGoalOz}
              onChange={(e) => updateSettings({ waterGoalOz: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Step goal</label>
            <input
              className="input"
              type="number"
              min={0}
              value={settings.stepGoal}
              onChange={(e) => updateSettings({ stepGoal: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Sleep goal (hrs)</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.5"
              value={settings.sleepGoalHours}
              onChange={(e) => updateSettings({ sleepGoalHours: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </CardPad>

      {/* Notifications */}
      <CardPad>
        <SectionTitle
          title="Notifications"
          subtitle="Choose what HartCare nudges you about"
          icon={<Bell size={18} />}
        />
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <div className="font-medium text-text">Enable notifications</div>
            <p className="text-xs text-text-muted">Turn all reminders on or off.</p>
          </div>
          <Toggle
            checked={settings.notificationsEnabled}
            onChange={(notificationsEnabled) => updateSettings({ notificationsEnabled })}
          />
        </div>
        <div className="mt-4 space-y-3">
          {NOTIFICATION_CATEGORIES.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3">
              <span className={settings.notificationsEnabled ? "text-text" : "text-text-muted"}>
                {c.label}
              </span>
              <Toggle
                checked={settings.notificationsEnabled && categories[c.key]}
                onChange={(v) => setCategories((prev) => ({ ...prev, [c.key]: v }))}
              />
            </div>
          ))}
        </div>
      </CardPad>

      {/* Privacy & safety */}
      <CardPad className="bg-gradient-to-br from-mint-50 to-surface-card dark:from-mint-500/10">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-mint-100 text-mint-600 dark:bg-mint-500/15 shrink-0">
            <Shield size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-text">Privacy & safety</h3>
            <p className="text-sm text-text-muted mt-1">
              HartCare provides wellness information to help your family build healthy habits — it
              is not medical advice and never a diagnosis. Your household&apos;s data is private and
              stays on your device in this demo.
            </p>
          </div>
        </div>
      </CardPad>

      {/* Data */}
      <CardPad>
        <SectionTitle title="Data" subtitle="Manage your demo data" icon={<Trash2 size={18} />} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted max-w-md">
            Reset everything back to the sample Hart family household. This clears any changes
            you&apos;ve made in this demo.
          </p>
          <button className="btn-outline shrink-0" onClick={() => setResetOpen(true)}>
            <Trash2 size={16} /> Reset demo data
          </button>
        </div>
      </CardPad>

      {/* About */}
      <CardPad>
        <div className="text-center text-sm text-text-muted">
          <p className="font-semibold text-text">HartCare</p>
          <p className="mt-0.5">Healthy living, together.</p>
          <p className="mt-1 text-xs">Version 1.0.0</p>
        </div>
      </CardPad>

      {/* Reset modal */}
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo data?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                resetDemo();
                setResetOpen(false);
              }}
            >
              Reset data
            </button>
          </>
        }
      >
        <p className="text-sm text-text">
          This restores the sample Hart family household and clears any profiles, logs and changes
          you&apos;ve made in this demo. This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}
