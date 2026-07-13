"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import InferenceSettingsForm from "./inference-settings-form";
import { Bot } from "@econic";
import React from "react";

interface InferenceSettingsDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function InferenceSettingsDialog({
  open,
  setOpen,
}: InferenceSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex w-full gap-2 p-1 items-center cursor-pointer">
            <Bot className="w-4 h-4" />
            Inference Settings
          </div>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle>Inference Settings</DialogTitle>
          <DialogDescription>
            Configure inference parameters.

          </DialogDescription>
          <InferenceSettingsForm setOpen={setOpen} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
