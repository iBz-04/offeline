"use client";

import useChatStore from "@/hooks/useChatStore";

export function ModelLoadingBar() {
  const isModelLoading = useChatStore((state) => state.isModelLoading);
  const progress = useChatStore((state) => state.modelLoadProgress);
  const status = useChatStore((state) => state.modelLoadStatus);

  if (!isModelLoading || progress === null) return null;

  return (
    <div className="mx-3 mb-2 rounded-2xl bg-card px-4 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-muted-foreground">
          {status ?? "Loading model"}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground/70">
          {progress}%
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-foreground/25 transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
