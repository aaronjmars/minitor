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
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDeckStore } from "@/lib/store/use-deck-store";
import { RenameDialog } from "@/components/dialogs/rename-dialog";

export function DeckTabs() {
  const deckOrder = useDeckStore((s) => s.deckOrder);
  const decks = useDeckStore((s) => s.decks);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const reorderDecks = useDeckStore((s) => s.reorderDecks);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const addDeck = useDeckStore((s) => s.addDeck);

  const [newDeckOpen, setNewDeckOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(ev: DragEndEvent) {
    const { active, over } = ev;
    if (!over || active.id === over.id) return;
    const oldIndex = deckOrder.indexOf(String(active.id));
    const newIndex = deckOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderDecks(arrayMove(deckOrder, oldIndex, newIndex));
  }

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={deckOrder} strategy={horizontalListSortingStrategy}>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {deckOrder.map((id) => {
                const deck = decks[id];
                if (!deck) return null;
                return (
                  <DeckTab
                    key={id}
                    id={id}
                    name={deck.name}
                    columnCount={deck.columnIds.length}
                    active={id === activeDeckId}
                    onClick={() => setActiveDeck(id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1 rounded-full text-muted-foreground transition-colors hover:bg-surface/70 hover:text-[color:var(--brand-hover)]"
          onClick={() => setNewDeckOpen(true)}
        >
          <Plus className="size-4" />
          New deck
        </Button>
      </div>

      <RenameDialog
        open={newDeckOpen}
        onOpenChange={setNewDeckOpen}
        title="New deck"
        initialValue=""
        placeholder="Deck name"
        onSubmit={(name) => {
          const id = addDeck(name);
          setActiveDeck(id);
        }}
      />
    </>
  );
}

function DeckTab({
  id,
  name,
  columnCount,
  active,
  onSelect,
}: {
  id: string;
  name: string;
  columnCount: number;
  active: boolean;
  onSelect: () => void;
}) {
  const renameDeck = useDeckStore((s) => s.renameDeck);
  const deleteDeck = useDeckStore((s) => s.deleteDeck);
  const [renameOpen, setRenameOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative flex shrink-0 items-center gap-0 rounded-full pl-1 pr-0.5 transition-all",
          active
            ? "bg-surface-elevated ring-1 ring-[oklab(0.263084_-0.00230259_0.0124794_/_0.12)]"
            : "hover:bg-surface/70",
          isDragging && "opacity-60",
        )}
      >
        <button
          type="button"
          aria-label="Drag deck"
          className="cursor-grab touch-none px-1 py-1.5 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <svg width="8" height="12" viewBox="0 0 10 14" className="fill-current">
            <circle cx="2" cy="3" r="1" />
            <circle cx="2" cy="7" r="1" />
            <circle cx="2" cy="11" r="1" />
            <circle cx="8" cy="3" r="1" />
            <circle cx="8" cy="7" r="1" />
            <circle cx="8" cy="11" r="1" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "max-w-[180px] truncate px-2 py-1.5 text-[13px] transition-colors",
            active
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-[color:var(--brand-hover)]",
          )}
        >
          {name}
          <span
            className={cn(
              "ml-1.5 rounded-full px-1.5 py-px text-[10px] font-medium tabular-nums",
              active
                ? "bg-foreground/10 text-foreground"
                : "bg-foreground/[0.06] text-muted-foreground",
            )}
          >
            {columnCount}
          </span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Deck options"
            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 data-[popup-open]:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil className="mr-2 size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => deleteDeck(id)}>
              <Trash2 className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename deck"
        initialValue={name}
        onSubmit={(next) => renameDeck(id, next)}
      />
    </>
  );
}
