"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { useDeckStore } from "@/lib/store/use-deck-store";
import { ColumnCard } from "@/components/column/column-card";
import { AddColumnDialog } from "@/components/column/add-column-dialog";

export function DeckBoard({ deckId }: { deckId: string }) {
  const deck = useDeckStore((s) => s.decks[deckId]);
  const columns = useDeckStore((s) => s.columns);
  const reorderColumnsInDeck = useDeckStore((s) => s.reorderColumnsInDeck);

  const [addOpen, setAddOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!deck) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Deck not found.
      </div>
    );
  }

  function handleDragEnd(ev: DragEndEvent) {
    if (!deck) return;
    const { active, over } = ev;
    if (!over || active.id === over.id) return;
    const oldIndex = deck.columnIds.indexOf(String(active.id));
    const newIndex = deck.columnIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderColumnsInDeck(deck.id, arrayMove(deck.columnIds, oldIndex, newIndex));
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-3 p-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={deck.columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {deck.columnIds.map((id) => {
              const col = columns[id];
              if (!col) return null;
              return <ColumnCard key={id} column={col} />;
            })}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="group relative flex h-full w-[280px] shrink-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed border-border bg-transparent text-sm text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-[oklab(0.263084_-0.00230259_0.0124794_/_0.22)] hover:bg-surface/40 hover:text-foreground hover:shadow-[0_8px_24px_-16px_rgba(0,0,0,0.18)] active:translate-y-0"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(245,78,0,0.08), transparent 60%)",
            }}
          />
          <div className="relative flex size-11 items-center justify-center rounded-full bg-surface-elevated ring-1 ring-border transition-all duration-200 group-hover:scale-110 group-hover:rotate-90 group-hover:bg-[color:var(--brand)] group-hover:text-white group-hover:ring-[color:var(--brand)]/50 group-hover:shadow-[0_0_0_6px_rgba(245,78,0,0.08)]">
            <Plus className="size-5 transition-transform duration-200" />
          </div>
          <span className="font-medium transition-transform duration-200 group-hover:translate-y-0.5">
            Add column
          </span>
        </button>
      </div>

      <AddColumnDialog open={addOpen} onOpenChange={setAddOpen} deckId={deck.id} />
    </div>
  );
}
