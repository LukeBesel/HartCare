"use client";

import { Toggle } from "@/components/ui";
import type { WidgetConfig } from "@/lib/types";
import { DEFAULT_DASHBOARD } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import { WIDGETS } from "./registry";

/* ------------------------------ Sortable row ----------------------------- */
function SortableRow({
  cfg,
  onToggle,
  onCycleWidth,
}: {
  cfg: WidgetConfig;
  onToggle: () => void;
  onCycleWidth: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cfg.id,
  });
  const meta = WIDGETS[cfg.id];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-card px-3 py-3 transition-shadow",
        isDragging ? "shadow-lg ring-2 ring-brand-400 opacity-90 z-10 relative" : "",
        !cfg.enabled && "opacity-60",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-text-muted hover:text-text active:cursor-grabbing rounded-lg p-1"
        aria-label={`Drag to reorder ${meta.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>

      <span className="grid place-items-center h-9 w-9 rounded-xl bg-surface-muted text-brand-600 shrink-0">
        <Icon size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{meta.title}</div>
        <div className="text-xs text-text-muted">{cfg.enabled ? "Visible" : "Hidden"}</div>
      </div>

      <button
        type="button"
        onClick={onCycleWidth}
        className="btn-outline px-2.5 py-1.5 text-xs font-semibold"
        title={`Width: ${cfg.w} of 3 columns (click to change)`}
        aria-label={`Width ${cfg.w} of 3 columns, click to change`}
      >
        {cfg.w}&times;
      </button>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "grid place-items-center h-9 w-9 rounded-xl transition-colors",
          cfg.enabled ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15" : "bg-surface-muted text-text-muted",
        )}
        title={cfg.enabled ? `Hide ${meta.title}` : `Show ${meta.title}`}
        aria-label={cfg.enabled ? `Hide ${meta.title}` : `Show ${meta.title}`}
        aria-pressed={cfg.enabled}
      >
        {cfg.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
}

/* ------------------------------ Customizer ------------------------------- */
export function Customizer({
  layout,
  onChange,
}: {
  layout: WidgetConfig[];
  onChange: (next: WidgetConfig[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.findIndex((w) => w.id === active.id);
    const newIndex = layout.findIndex((w) => w.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(layout, oldIndex, newIndex));
  }

  function toggle(id: string) {
    onChange(layout.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
  }

  function cycleWidth(id: string) {
    onChange(
      layout.map((w) =>
        w.id === id ? { ...w, w: ((w.w % 3) + 1) as 1 | 2 | 3 } : w,
      ),
    );
  }

  function reset() {
    onChange(DEFAULT_DASHBOARD.map((w) => ({ ...w })));
  }

  return (
    <div className="card card-pad animate-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Customize your dashboard</h2>
          <p className="text-sm text-text-muted">
            Drag to reorder, toggle visibility, and cycle each widget&apos;s width.
          </p>
        </div>
        <button type="button" onClick={reset} className="btn-outline py-2">
          <RotateCcw size={16} /> Reset layout
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {layout.map((cfg) => (
              <SortableRow
                key={cfg.id}
                cfg={cfg}
                onToggle={() => toggle(cfg.id)}
                onCycleWidth={() => cycleWidth(cfg.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
