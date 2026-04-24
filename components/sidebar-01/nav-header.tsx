"use client";

import { Activity, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { SidebarHeader } from "@/components/ui/sidebar";
import { getColumnType } from "@/lib/columns/registry";
import { useDeckStore } from "@/lib/store/use-deck-store";
import { focusColumn } from "@/components/sidebar-01/nav-decks";

interface Props {
  onAddDeck: () => void;
  onAddColumn: () => void;
}

export function NavHeader({ onAddDeck, onAddColumn }: Props) {
  const [open, setOpen] = useState(false);
  const decks = useDeckStore((s) => s.decks);
  const deckOrder = useDeckStore((s) => s.deckOrder);
  const columns = useDeckStore((s) => s.columns);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <SidebarHeader className="gap-2">
        <div className="flex items-baseline gap-1 px-2 pt-2">
          <Activity className="size-3.5 translate-y-0.5 text-sidebar-foreground" strokeWidth={2.25} />
          <span
            className="font-serif text-[20px] leading-none italic text-sidebar-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            Minitor
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-1 mt-1 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <span className="flex items-center gap-2">
            <Search className="size-3.5" />
            <span className="text-[13px]">Search</span>
          </span>
          <kbd className="inline-flex items-center rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/60">
            ⌘K
          </kbd>
        </button>
      </SidebarHeader>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a deck, column, or action…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                onAddDeck();
              }}
            >
              <Plus className="mr-2 size-4" /> New deck
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                onAddColumn();
              }}
            >
              <Plus className="mr-2 size-4" /> Add column to current deck
            </CommandItem>
          </CommandGroup>

          {deckOrder.length > 0 && (
            <>
              <CommandSeparator className="my-1" />
              <CommandGroup heading="Decks">
                {deckOrder.map((id) => {
                  const deck = decks[id];
                  if (!deck) return null;
                  return (
                    <CommandItem
                      key={id}
                      value={`deck-${deck.name}-${id}`}
                      onSelect={() => {
                        setOpen(false);
                        setActiveDeck(id);
                      }}
                    >
                      <span className="mr-2 inline-block size-1.5 rounded-full bg-[color:var(--brand)]" />
                      <span>{deck.name}</span>
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                        {deck.columnIds.length}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {Object.keys(columns).length > 0 && (
            <>
              <CommandSeparator className="my-1" />
              <CommandGroup heading="Columns">
                {deckOrder.flatMap((deckId) => {
                  const deck = decks[deckId];
                  if (!deck) return [];
                  return deck.columnIds.map((cid) => {
                    const col = columns[cid];
                    if (!col) return null;
                    const type = getColumnType(col.typeId);
                    const Icon = type?.icon;
                    const accent = type?.accent ?? "#999";
                    return (
                      <CommandItem
                        key={cid}
                        value={`col-${col.title}-${deck.name}-${cid}`}
                        onSelect={() => {
                          setOpen(false);
                          setActiveDeck(deckId);
                          requestAnimationFrame(() => focusColumn(cid));
                        }}
                      >
                        <span
                          className="mr-2 inline-flex size-4 items-center justify-center rounded-sm"
                          style={{ backgroundColor: `${accent}33`, color: accent }}
                        >
                          {Icon ? <Icon className="size-2.5" strokeWidth={2.5} /> : null}
                        </span>
                        <span className="truncate">{col.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          in {deck.name}
                        </span>
                      </CommandItem>
                    );
                  });
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
