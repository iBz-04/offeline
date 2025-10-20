"use client";

import { useEffect, useState } from "react";
import { LoadingScreen } from "./ui/loading-screen";
import useChatStore from "@/hooks/useChatStore";
import useMemoryStore from "@/hooks/useMemoryStore";

export function LoadingScreenWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isSplashing, setIsSplashing] = useState(true);
  const [storesHydrated, setStoresHydrated] = useState(false);

  useEffect(() => {
    // Only show splash screen on first load of the session
    const hasLoadedBefore = sessionStorage.getItem('app_loaded');
    if (hasLoadedBefore) {
      setIsSplashing(false);
    } else {
      const timer = setTimeout(() => {
        setIsSplashing(false);
        sessionStorage.setItem('app_loaded', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const isLoading = isAppLoading || isSplashing;

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </>
  );
}