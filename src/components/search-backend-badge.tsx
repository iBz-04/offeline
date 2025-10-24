"use client";

import React, { useEffect, useState } from "react";
import { Globe } from "lucide-react";

export default function SearchBackendBadge() {
  const [backend, setBackend] = useState<"tavily" | "duckduckgo">("duckduckgo");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("searchBackend");
      if (stored === "tavily" || stored === "duckduckgo") {
        setBackend(stored);
      }
    }
  }, []);

  const bgColor = backend === "tavily" ? "bg-blue-500/20" : "bg-amber-500/20";
  const textColor = backend === "tavily" ? "text-blue-600" : "text-amber-600";
  const borderColor = backend === "tavily" ? "border-blue-500/30" : "border-amber-500/30";
  const label = backend === "tavily" ? "Tavily" : "DuckDuckGo";

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${bgColor} ${textColor} ${borderColor}`}>
      <Globe className="w-3 h-3" />
      {label}
    </div>
  );
}
