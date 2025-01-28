"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HoverCardProps {
  children: ReactNode;
  text: string;
  className?: string;
}

export function HoverCard({ children, text, className }: HoverCardProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className={cn(
        "invisible group-hover:visible opacity-0 group-hover:opacity-100",
        "absolute z-50 px-2 py-1 mt-2 text-sm text-white",
        "bg-gray-900 rounded-md shadow-lg transition-all duration-200",
        "dark:bg-gray-700",
        className
      )}>
        {text}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
      </div>
    </div>
  );
} 