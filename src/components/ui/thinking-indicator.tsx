import { InfinityIcon } from "@econic";

export default function ThinkingIndicator() {
  return (
    <p className="flex items-center gap-2 font-body text-base italic text-foreground/35 animate-pulse">
      <InfinityIcon className="h-4 w-4 shrink-0" />
      <span>Thinking...</span>
    </p>
  );
}
