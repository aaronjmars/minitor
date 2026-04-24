"use client";

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listColumnTypes } from "@/lib/columns/registry";
import { useDeckStore } from "@/lib/store/use-deck-store";
import type { ColumnType } from "@/lib/columns/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
}

export function AddColumnDialog({ open, onOpenChange, deckId }: Props) {
  const addColumn = useDeckStore((s) => s.addColumn);
  const types = useMemo(() => listColumnTypes(), []);

  const [selectedType, setSelectedType] = useState<ColumnType | null>(null);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [title, setTitle] = useState("");

  function reset() {
    setSelectedType(null);
    setConfig({});
    setTitle("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function pickType(type: ColumnType) {
    setSelectedType(type);
    setConfig({ ...(type.defaultConfig as Record<string, unknown>) });
    setTitle(type.defaultTitle(type.defaultConfig as never));
  }

  function commit() {
    if (!selectedType) return;
    const finalTitle = title.trim() || selectedType.defaultTitle(config as never);
    addColumn(deckId, selectedType.id, finalTitle, config);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">
            {selectedType ? `New ${selectedType.label} column` : "Add a column"}
          </DialogTitle>
        </DialogHeader>

        {!selectedType && (
          <ul role="list" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {types.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.id} className="col-span-1">
                  <button
                    type="button"
                    onClick={() => pickType(t)}
                    className="group flex w-full overflow-hidden rounded-md border border-border bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all hover:border-[oklab(0.263084_-0.00230259_0.0124794_/_0.22)] hover:shadow-sm"
                  >
                    <div
                      className="flex w-12 shrink-0 items-center justify-center"
                      style={{ backgroundColor: `${t.accent}33`, color: t.accent }}
                    >
                      <Icon className="size-5" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 flex-1 truncate px-3 py-2 text-left">
                      <div
                        className="truncate text-[13px] font-medium text-foreground group-hover:text-[color:var(--brand-hover)]"
                        style={{ letterSpacing: "-0.005em" }}
                      >
                        {t.label}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                        {t.description}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {selectedType && (
          <div className="grid gap-4">
            <selectedType.ConfigForm
              value={config as never}
              onChange={(next) => {
                setConfig(next as Record<string, unknown>);
                setTitle(selectedType.defaultTitle(next as never));
              }}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="col-title">Column title</Label>
              <Input
                id="col-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {selectedType && (
            <Button variant="ghost" onClick={() => setSelectedType(null)}>
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          {selectedType && <Button onClick={commit}>Add column</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
