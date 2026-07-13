"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { InfoPage } from "@/components/info-page";
import type { InfoPageConfig } from "@/lib/info-pages";
import { ChevronLeftIcon } from "@econic";
import React from "react";

type InfoPageDialogProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  config: InfoPageConfig;
};

export default function InfoPageDialog({
  open,
  setOpen,
  config,
}: InfoPageDialogProps) {
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex w-full gap-2 p-1 items-center cursor-pointer">
            <Icon className="w-4 h-4" />
            {config.menuLabel}
          </div>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background [&>button]:hidden">
        <div className="relative flex items-center justify-center h-8">
          <DialogClose
            aria-label="Back to Settings"
            className="absolute left-0 flex items-center justify-center rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </DialogClose>
          <DialogTitle className="text-lg font-semibold">{config.title}</DialogTitle>
        </div>
        <DialogDescription className="sr-only">{config.description}</DialogDescription>
        <InfoPage config={config} hideHeader className="mt-4" />
      </DialogContent>
    </Dialog>
  );
}
