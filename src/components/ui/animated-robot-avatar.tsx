"use client";

import { cn } from "@/lib/utils";

export function AnimatedRobotAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-7 h-7", className)}>
      <svg 
        viewBox="0 0 24 24" 
        className="w-full h-full"
        fill="currentColor"
      >
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5A2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5a2.5 2.5 0 0 0 2.5 2.5a2.5 2.5 0 0 0 2.5-2.5a2.5 2.5 0 0 0-2.5-2.5Z"/>
      </svg>
      <div className={cn(
        "absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full",
        "transition-opacity duration-300",
        className?.includes?.("animate-pulse") ? "animate-gradient opacity-100" : "opacity-0"
      )} />
    </div>
  );
} 