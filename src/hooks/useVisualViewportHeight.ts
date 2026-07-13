"use client";

import { useEffect } from "react";

function syncViewportHeight() {
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty(
    "--keyboard-inset",
    `${Math.max(0, window.innerHeight - height)}px`
  );
}

export function useVisualViewportHeight() {
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(syncViewportHeight);
    };

    const lockDocumentScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    syncViewportHeight();

    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.addEventListener("resize", handleResize);

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) {
      window.addEventListener("scroll", lockDocumentScroll, { passive: true });
    }

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("resize", handleResize);
      if (isCoarsePointer) {
        window.removeEventListener("scroll", lockDocumentScroll);
      }
      document.documentElement.style.removeProperty("--app-height");
      document.documentElement.style.removeProperty("--keyboard-inset");
    };
  }, []);
}
