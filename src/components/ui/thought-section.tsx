"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@econic";

export default function ThoughtSection({ thought }: { thought: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 font-ui text-sm text-muted-foreground/70 transition-opacity hover:opacity-80"
      >
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
        <span>Thought</span>
      </button>
      {open && (
        <p className="mt-3 font-ui text-sm italic leading-relaxed text-muted-foreground/60 whitespace-pre-wrap">
          {thought}
        </p>
      )}
    </div>
  );
}
