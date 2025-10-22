"use client";

import { Button } from "./ui/button";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clearAppCache } from "@/lib/cache-manager";

export default function ClearCacheButton() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearAppCache();
      toast.success("Cache cleared successfully");
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      toast.error("Failed to clear cache");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      onClick={handleClearCache}
      disabled={isClearing}
      variant="outline"
      size="sm"
      className="w-full gap-2"
    >
      <Trash2 className="w-4 h-4" />
      {isClearing ? "Clearing..." : "Clear Cache"}
    </Button>
  );
}
