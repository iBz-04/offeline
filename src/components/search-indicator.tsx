"use client";

import { Loader2 } from "lucide-react";

export default function SearchIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Searching the web...</span>
    </div>
  );
}
