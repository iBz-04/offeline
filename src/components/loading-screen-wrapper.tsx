"use client";

import { useEffect, useState } from "react";
import useChatStore from "@/hooks/useChatStore";
import useMemoryStore from "@/hooks/useMemoryStore";

export function LoadingScreenWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [storesHydrated, setStoresHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand stores to rehydrate
    const rehydrateStores = async () => {
      await Promise.all([
        useChatStore.persist.rehydrate(),
        useMemoryStore.persist.rehydrate()
      ]);
      setStoresHydrated(true);
    };

    rehydrateStores();
  }, []);

  useEffect(() => {
    if (storesHydrated) {
      setIsAppLoading(false);
    }
  }, [storesHydrated]);

  return (
    <div className={isAppLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
      {children}
    </div>
  );
}