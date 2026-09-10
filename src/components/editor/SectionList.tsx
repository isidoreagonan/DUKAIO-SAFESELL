import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Copy, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useScopeSections, useThemeStore } from "@/store/useThemeStore";
import { getDefinition } from "@/theme/registry";
import type { Scope, SectionInstance } from "@/theme/types";
import { cn } from "@/lib/utils";

function SortableRow({ section }: { section: SectionInstance }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const selectedId = useThemeStore((s) => s.selectedId);
  const select = useThemeStore((s) => s.select);
  const removeSection = useThemeStore((s) => s.removeSection);
  const duplicateSection = useThemeStore((s) => s.duplicateSection);
  const toggleVisible = useThemeStore((s) => s.toggleVisible);
  const def = getDefinition(section.type);
  if (!def) return null;
  const Icon = def.icon;
  const isSelected = selectedId === section.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-1 rounded-[6px] border px-1.5 py-2 transition-all",
        isSelected
          ? "border-primary/50 bg-primary/10 text-primary font-medium shadow-xs"
          : "border-transparent hover:border-border hover:bg-accent/60 text-foreground",
        isDragging && "z-10 border-border bg-card shadow-lg",
        !section.visible && "opacity-50",
      )}
    >
      <button
        type="button"
        aria-label="Déplacer la section"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={15} />
      </button>
      <button
        type="button"
        onClick={() => select(section.id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
      >
        <Icon
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            isSelected ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span className="truncate">{def.label}</span>
      </button>
      <div className="flex items-center gap-0.5 md:opacity-0 md:transition md:group-hover:opacity-100">
        <button
          type="button"
          aria-label="Afficher/masquer"
          onClick={() => toggleVisible(section.id)}
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          title={section.visible ? "Masquer" : "Afficher"}
        >
          {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          type="button"
          aria-label="Dupliquer"
          onClick={() => duplicateSection(section.id)}
          className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          title="Dupliquer"
        >
          <Copy size={14} />
        </button>
        {!def.unique && (
          <button
            type="button"
            aria-label="Supprimer"
            onClick={() => removeSection(section.id)}
            className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <ChevronRight
        size={14}
        className={cn(
          "shrink-0 transition-transform",
          isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground"
        )}
      />
    </div>
  );
}

export function SectionList({ scope }: { scope: Scope }) {
  const sections = useScopeSections(scope);
  const reorder = useThemeStore((s) => s.reorder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) reorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {sections.map((section) => (
            <SortableRow key={section.id} section={section} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
