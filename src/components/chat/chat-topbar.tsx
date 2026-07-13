"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { CaretSortIcon, HamburgerMenuIcon } from "@econic";
import { Sidebar } from "../sidebar";
import useChatStore from "@/hooks/useChatStore";
import { DesktopModels, MobileModels } from "@/lib/models";
import { ModelBadge } from "../ui/model-badge";

interface ChatTopbarProps {
  chatId?: string;
  stopAction: () => void;
}

export default function ChatTopbar({ chatId, stopAction }: ChatTopbarProps) {
  const [open, setOpen] = React.useState(false);

  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const isLoading = useChatStore((state) => state.isLoading);

  return (
    <div className="relative w-full px-4 pt-safe pb-4 md:py-6 flex items-center justify-center">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 md:hidden">
        <Sheet>
          <SheetTrigger>
            <HamburgerMenuIcon className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left">
            <Sidebar chatId={chatId || ""} isCollapsed={false} stopAction={stopAction} />
          </SheetContent>
        </Sheet>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-fit max-w-[min(300px,calc(100vw-5.5rem))] justify-between gap-2 rounded-full bg-transparent px-4 font-ui hover:bg-card/60"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate">{selectedModel.displayName}</span>
              {selectedModel.badge && (
                <ModelBadge color={selectedModel.badgeColor} className="shrink-0">
                  {selectedModel.badge}
                </ModelBadge>
              )}
            </div>
            <CaretSortIcon className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] md:w-[300px] max-h-96 overflow-y-scroll p-2 rounded-2xl">
          <p className="px-2 pb-1 font-ui text-xs font-medium text-muted-foreground">Mobile</p>
          {MobileModels.map((model) => (
            <Button
              key={model.name}
              variant="ghost"
              className="w-full justify-start flex gap-2 items-center truncate"
              onClick={() => {
                setSelectedModel(model);
                setOpen(false);
              }}
            >
              {model.displayName}
              {model.badge && (
                <ModelBadge color={model.badgeColor}>
                  {model.badge}
                </ModelBadge>
              )}
            </Button>
          ))}

          <p className="px-2 pt-3 pb-1 font-ui text-xs font-medium text-muted-foreground">Desktop</p>
          {DesktopModels.map((model) => (
            <Button
              key={model.name}
              variant="ghost"
              className="w-full justify-start flex gap-2 items-center truncate"
              onClick={() => {
                setSelectedModel(model);
                setOpen(false);
              }}
            >
              {model.displayName}
              {model.badge && (
                <ModelBadge color={model.badgeColor}>
                  {model.badge}
                </ModelBadge>
              )}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
