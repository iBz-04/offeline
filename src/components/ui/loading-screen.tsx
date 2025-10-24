"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const startTime = Date.now();
      const duration = 1200; // 1.2 seconds to complete
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(Math.floor((elapsed / duration) * 100), 100);
        
        setProgress(newProgress);
        
        if (newProgress >= 100) {
          clearInterval(interval);
        }
      }, 16); // ~60fps for smooth animation

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [isLoading]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background",
        "transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Simple logo */}
        <Image
          src="/cat.png"
          alt="AI"
          width={64}
          height={64}
          className="invert dark:invert-0"
        />
        
        {/* Loading text - retro style */}
        <div className="text-2xl font-bold font-mono tracking-wider">
          LOADING
        </div>
        
        {/* Vintage segmented progress bar */}
        <div className="flex items-center gap-1 border-2 border-foreground p-1">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-6 h-8 border border-foreground transition-colors duration-100",
                index < Math.floor(progress / 10)
                  ? "bg-foreground"
                  : "bg-background"
              )}
            />
          ))}
        </div>
        
        {/* Progress percentage */}
        <div className="text-sm font-mono">
          {progress}%
        </div>
      </div>
    </div>
  );
} 