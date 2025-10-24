"use client";

import { Globe } from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import useChatStore from "@/hooks/useChatStore";

export default function WebSearchToggle() {
  const searchEnabled = useChatStore((state) => state.searchEnabled);
  const setSearchEnabled = useChatStore((state) => state.setSearchEnabled);
  const isSearching = useChatStore((state) => state.isSearching);
  const isLoading = useChatStore((state) => state.isLoading);

  const handleToggle = () => {
    if (!isLoading && !isSearching) {
      setSearchEnabled(!searchEnabled);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-9 w-9 shrink-0 transition-colors ${
              searchEnabled
                ? "text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={handleToggle}
            disabled={isLoading || isSearching}
          >
            <Globe
              className={`h-5 w-5 transition-transform ${
                searchEnabled ? "scale-110" : ""
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            {searchEnabled
              ? "Web search enabled - AI can search the internet using tools"
              : "Click to enable web search tools"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
