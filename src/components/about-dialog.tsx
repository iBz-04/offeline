"use client";

import Image from "next/image";
import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ChevronLeftIcon, InfoCircledIcon } from "@econic";

interface AboutDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AboutDialog({ open, setOpen }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex w-full gap-2 p-1 items-center cursor-pointer">
            <InfoCircledIcon className="w-4 h-4" />
            About
          </div>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-background [&>button]:hidden">
        <div className="relative flex items-center justify-center h-8">
          <DialogClose
            aria-label="Back to Settings"
            className="absolute left-0 flex items-center justify-center rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </DialogClose>
          <DialogTitle className="text-lg font-semibold">About</DialogTitle>
        </div>

        <DialogDescription className="sr-only">
          About offeline and the quaynor inference library.
        </DialogDescription>

        <p className="mt-4 text-left text-base leading-8">
          <span className="font-semibold">offeline</span> is an app built to
          liberate the world from the direction of the current AI industry. We
          believe in having alternatives to every{" "}
          <span className="font-semibold">paid</span> software.{" "}
          <span className="font-semibold">offeline</span> was built on{" "}
          <a
            href="https://www.quaynor.site"
            target="_blank"
            rel="noopener noreferrer"
            className="inline font-semibold underline-offset-2 hover:underline"
          >
            <Image
              src="/quaynor.png"
              alt=""
              width={20}
              height={20}
              aria-hidden
              className="inline-block rounded-[4px] align-baseline"
              style={{ verticalAlign: "-4px" }}
            />{" "}
            quaynor
          </a>
          , an open-source
          inference library allowing anyone to run AI directly on mobile
          devices.
        </p>

        <div className="mt-16 flex justify-center pb-4">
          <Image
            src="/offeline.png"
            alt="offeline"
            width={120}
            height={120}
            className="h-[120px] w-[120px] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
