"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RenameDialog } from "@/components/dialogs/rename-dialog";
import { useDeckStore } from "@/lib/store/use-deck-store";
import { AddColumnDialog } from "@/components/column/add-column-dialog";

export function NavFooter() {
  const addDeck = useDeckStore((s) => s.addDeck);
  const setActiveDeck = useDeckStore((s) => s.setActiveDeck);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);

  const [newDeckOpen, setNewDeckOpen] = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);

  return (
    <>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-full items-center justify-end gap-2 rounded-md px-2 text-right text-sm text-sidebar-foreground/80 outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-foreground">
                <Plus className="size-4" />
                <span>Add new</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-auto">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-right">
                    Create
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    className="justify-end"
                    onClick={() => setNewDeckOpen(true)}
                  >
                    <Plus className="mr-2 size-4" /> New deck
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-end"
                    onClick={() => setAddColOpen(true)}
                    disabled={!activeDeckId}
                  >
                    <Plus className="mr-2 size-4" /> Add column
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

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
      {activeDeckId && (
        <AddColumnDialog
          open={addColOpen}
          onOpenChange={setAddColOpen}
          deckId={activeDeckId}
        />
      )}
    </>
  );
}
