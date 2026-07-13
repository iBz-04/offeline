"use client";

import { useVisualViewportHeight } from "@/hooks/useVisualViewportHeight";

export function MobileViewportSync() {
  useVisualViewportHeight();
  return null;
}
