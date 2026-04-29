"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { RelativeTime } from "@/components/relative-time";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getColumnType } from "@/lib/columns/registry";
import { useDeckStore } from "@/lib/store/use-deck-store";
import type { Column } from "@/lib/columns/types";
import { ConfigureColumnDialog } from "@/components/column/configure-column-dialog";
import { RenameDialog } from "@/components/dialogs/rename-dialog";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";

export function ColumnCard({ column }: { column: Column }) {
  const type = getColumnType(column.typeId);
  const removeColumn = useDeckStore((s) => s.removeColumn);
  const applyFetchedItems = useDeckStore((s) => s.applyFetchedItems);
  const renameColumn = useDeckStore((s) => s.renameColumn);
  const isAutoFetching = useDeckStore((s) => s.autoFetchingIds.has(column.id));

  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // undefined = unknown (initial state, never fetched OR no pagination support)
  // string = ready to load that page
  // null = exhausted
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(
    undefined,
  );
  const [configureOpen, setConfigureOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id });

  if (!type) {
    return (
      <div className="flex w-[360px] shrink-0 flex-col rounded-lg border border-destructive/50 bg-card p-4 text-sm">
        <p className="font-medium">Unknown column type</p>
        <p className="mt-1 text-muted-foreground">
          Type <code>{column.typeId}</code> is not registered.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={() => removeColumn(column.id)}
        >
          Remove
        </Button>
      </div>
    );
  }

  const Icon = type.icon;
  const ItemRenderer = type.ItemRenderer;

  async function onRefresh() {
    if (!type) return;
    setIsFetching(true);
    const started = Date.now();
    try {
      let items;
      let cursor: string | undefined;
      if (type.fetchPage) {
        const r = await type.fetchPage(column.config as never);
        items = r.items;
        cursor = r.nextCursor;
      } else {
        items = await type.fetch(column.config as never);
      }
      const count = await applyFetchedItems(column.id, items);
      // Reset pagination cursor on a fresh refresh.
      setNextCursor(type.fetchPage ? (cursor ?? null) : undefined);
      toast.success(count > 0 ? `${count} new item${count === 1 ? "" : "s"}` : "No new items", {
        description: column.title,
      });
    } catch (err) {
      toast.error("Fetch failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      // Keep the beam visible for a minimum duration so the animation registers.
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, 1800 - elapsed);
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }
      setIsFetching(false);
    }
  }

  async function onLoadMore() {
    if (!type?.fetchPage) return;
    if (typeof nextCursor !== "string") return;
    setIsLoadingMore(true);
    try {
      const r = await type.fetchPage(column.config as never, nextCursor);
      await applyFetchedItems(column.id, r.items);
      setNextCursor(r.nextCursor ?? null);
    } catch (err) {
      toast.error("Couldn't load more", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const isGrokAsk = column.typeId === "grok-ask";
  const beamActive = isGrokAsk || isFetching || isAutoFetching;

  return (
    <>
      <div
        ref={setNodeRef}
        id={`column-${column.id}`}
        style={{
          ...style,
          // consumed by the beam-frame CSS
          ["--beam-radius" as never]: "10px",
          ["--beam-duration" as never]: isGrokAsk ? "4s" : "2s",
        }}
        data-beam-active={beamActive ? "true" : "false"}
        data-beam-variant={isGrokAsk ? "grok" : "fetch"}
        className={cn(
          "beam-frame relative h-full w-[360px] shrink-0 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.12)] transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.18)]",
          isDragging &&
            "cursor-grabbing shadow-[0_24px_60px_-20px_rgba(0,0,0,0.32)] ring-1 ring-foreground/10",
        )}
      >
        <div
          className={cn(
            "group/col flex h-full w-full shrink-0 flex-col overflow-hidden bg-card",
          )}
        >
        <div className="relative flex items-center gap-2 border-b border-border bg-surface/50 px-3 py-2.5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
            style={{ background: `linear-gradient(90deg, transparent, ${type.accent}, transparent)` }}
          />
          <button
            type="button"
            aria-label="Drag column"
            className="shrink-0 cursor-grab touch-none text-muted-foreground/50 opacity-0 transition-opacity group-hover/col:opacity-100 hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md ring-1 ring-black/5"
            style={{ backgroundColor: `${type.accent}33`, color: type.accent }}
          >
            <Icon className="size-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[13px] font-medium leading-tight text-foreground"
              style={{ letterSpacing: "-0.01em" }}
            >
              {column.title}
            </div>
            <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <span className="truncate">{type.label}</span>
              {column.lastFetchedAt && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="truncate">
                    <RelativeTime date={column.lastFetchedAt} addSuffix />
                  </span>
                </>
              )}
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger
              onClick={onRefresh}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh"
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-[color:var(--brand-hover)] disabled:pointer-events-none disabled:opacity-50"
            >
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">Refresh</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Column options"
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-[color:var(--brand-hover)]"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setConfigureOpen(true)}>
                <Settings2 className="mr-2 size-4" /> Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 size-4" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {column.items.length === 0 ? (
            isFetching || isAutoFetching ? (
              <LoadingSkeleton />
            ) : (
              <EmptyState isFetching={isFetching} onRefresh={onRefresh} />
            )
          ) : (
            <div>
              {column.items.map((item) => (
                <ItemRenderer key={item.id} item={item} />
              ))}
              {type.fetchPage && typeof nextCursor === "string" && (
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="flex w-full items-center justify-center gap-2 px-3.5 py-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-surface/60 hover:text-foreground disabled:opacity-60"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more"
                  )}
                </button>
              )}
              {type.fetchPage && nextCursor === null && (
                <div className="px-3.5 py-3 text-center text-[11.5px] text-muted-foreground/70">
                  End of results
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      <ConfigureColumnDialog
        open={configureOpen}
        onOpenChange={setConfigureOpen}
        column={column}
      />
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title="Rename column"
        initialValue={column.title}
        onSubmit={(next) => renameColumn(column.id, next)}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${column.title}?`}
        description="Stored items for this column will be removed from Neon. The column type is not affected."
        confirmLabel="Delete column"
        onConfirm={() => removeColumn(column.id)}
      />
    </>
  );
}

function EmptyState({
  isFetching,
  onRefresh,
}: {
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="text-sm font-medium">No items yet</div>
      <div className="text-xs text-muted-foreground">
        Click refresh to fetch the latest.
      </div>
      <Button size="sm" variant="outline" onClick={onRefresh} disabled={isFetching}>
        {isFetching ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 size-4" />
        )}
        Refresh
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading items" className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonRow key={i} delay={i * 120} />
      ))}
    </div>
  );
}

function SkeletonRow({ delay }: { delay: number }) {
  const style = { animationDelay: `${delay}ms` };
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3">
      <div
        className="size-9 shrink-0 animate-pulse rounded-full bg-foreground/[0.06]"
        style={style}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-24 animate-pulse rounded bg-foreground/[0.06]"
            style={style}
          />
          <div
            className="h-3 w-12 animate-pulse rounded bg-foreground/[0.04]"
            style={style}
          />
        </div>
        <div
          className="h-3.5 w-full animate-pulse rounded bg-foreground/[0.06]"
          style={style}
        />
        <div
          className="h-3.5 w-4/5 animate-pulse rounded bg-foreground/[0.06]"
          style={style}
        />
      </div>
    </div>
  );
}
