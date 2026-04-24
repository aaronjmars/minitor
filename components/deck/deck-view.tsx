"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useDeckStore } from "@/lib/store/use-deck-store";
import { DeckBoard } from "@/components/deck/deck-board";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar-01/app-sidebar";
import { Onboarding } from "@/components/onboarding/welcome";
import { loadSnapshot } from "@/app/actions";

export function DeckView() {
  const hydrated = useDeckStore((s) => s.hydrated);
  const deckOrder = useDeckStore((s) => s.deckOrder);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);
  const activeDeck = useDeckStore((s) =>
    s.activeDeckId ? s.decks[s.activeDeckId] : null,
  );
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        useDeckStore.getState().hydrate(snapshot);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setLoadError(msg);
        toast.error("Could not load data from Neon", { description: msg });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (deckOrder.length === 0) return;
    if (!activeDeckId || !deckOrder.includes(activeDeckId)) {
      setActiveDeck(deckOrder[0]);
    }
  }, [hydrated, deckOrder, activeDeckId, setActiveDeck]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh">
        <Skeleton className="h-full w-64" />
        <div className="flex flex-1 gap-3 p-3">
          <Skeleton className="h-full w-[360px] rounded-lg" />
          <Skeleton className="h-full w-[360px] rounded-lg" />
          <Skeleton className="h-full w-[360px] rounded-lg" />
        </div>
        {loadError && (
          <div className="absolute inset-x-0 bottom-0 px-4 py-3 text-xs text-destructive">
            Failed to load from Neon: {loadError}
          </div>
        )}
      </div>
    );
  }

  if (deckOrder.length === 0) {
    return <Onboarding />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur-md">
          <SidebarTrigger className="size-8" />
          <div className="h-5 w-px bg-border" />
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="truncate pb-1 font-serif text-[20px] leading-[1.2] italic text-foreground"
              style={{ letterSpacing: "-0.01em" }}
            >
              {activeDeck?.name ?? "Minitor"}
            </span>
            {activeDeck && (
              <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {activeDeck.columnIds.length} column
                {activeDeck.columnIds.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </header>

        {activeDeckId ? (
          <DeckBoard deckId={activeDeckId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            No decks yet. Use the sidebar to create one.
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
