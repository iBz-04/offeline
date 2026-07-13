"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function AnimatedRobotAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-full shrink-0", className)}>
      <Image
        src="/offeline.png"
        alt="Offeline"
        fill
        sizes="40px"
        className="object-contain"
      />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full",
        "transition-opacity duration-300",
        className?.includes?.("animate-pulse") ? "animate-gradient opacity-100" : "opacity-0"
      )} />
    </div>
  );
} 