"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function AnimatedRobotAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-12 h-12", className)}>
      <Image
        src="/cat.png"
        alt="AI"
        width={48}
        height={48}
        className="w-full h-full invert dark:invert-0"
      />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full",
        "transition-opacity duration-300",
        className?.includes?.("animate-pulse") ? "animate-gradient opacity-100" : "opacity-0"
      )} />
    </div>
  );
} 