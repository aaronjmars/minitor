"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getColumnType } from "@/lib/columns/registry";
import { useDeckStore } from "@/lib/store/use-deck-store";
import { parseAlertKeywords } from "@/lib/columns/keyword-match";
import type { Column } from "@/lib/columns/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: Column;
}

const ALERT_KEYWORDS_MAX = 512;

export function ConfigureColumnDialog({ open, onOpenChange, column }: Props) {
  const type = getColumnType(column.typeId);
  const updateColumnConfig = useDeckStore((s) => s.updateColumnConfig);
  const updateAlertKeywords = useDeckStore((s) => s.updateAlertKeywords);

  const [draft, setDraft] = useState<Record<string, unknown>>(column.config);
  const [alertDraft, setAlertDraft] = useState<string>(
    column.alertKeywords ?? "",
  );
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(column.config);
      setAlertDraft(column.alertKeywords ?? "");
    }
  }

  if (!type) return null;

  function save() {
    updateColumnConfig(column.id, draft);
    const next = alertDraft.slice(0, ALERT_KEYWORDS_MAX);
    if (next !== (column.alertKeywords ?? "")) {
      updateAlertKeywords(column.id, next);
    }
    onOpenChange(false);
  }

  const parsedPreview = parseAlertKeywords(alertDraft);
  const previewCount = parsedPreview.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {type.label}</DialogTitle>
          <DialogDescription>{type.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <type.ConfigForm
            value={draft as never}
            onChange={(v) => setDraft(v as Record<string, unknown>)}
          />

          <Separator />

          <div className="grid gap-1.5">
            <Label htmlFor="alert-keywords" className="flex items-center gap-1.5">
              <Bell className="size-3.5" />
              Alert keywords
              <span className="text-[11px] font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="alert-keywords"
              placeholder="aeon, anthropic, claude"
              value={alertDraft}
              maxLength={ALERT_KEYWORDS_MAX}
              onChange={(e) => setAlertDraft(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma- or space-separated. Matching items get a highlight ring and
              the column header shows a badge with the match count.
              {previewCount > 0 && (
                <>
                  {" "}
                  Parsed {previewCount} term{previewCount === 1 ? "" : "s"}.
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
