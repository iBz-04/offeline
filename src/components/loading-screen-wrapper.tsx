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
  const [isLoading, setIsLoading] = useState(true);
  const [storesHydrated, setStoresHydrated] = useState(false);

  useEffect(() => {
    // Check if app has already been loaded in this session
    const hasLoadedBefore = sessionStorage.getItem('app_loaded');
    
    // Wait for Zustand stores to rehydrate
    const checkHydration = async () => {
      // Trigger rehydration for both stores
      await Promise.all([
        useChatStore.persist.rehydrate(),
        useMemoryStore.persist.rehydrate()
      ]);
      setStoresHydrated(true);
      
      // If already loaded in this session, skip loading screen
      if (hasLoadedBefore) {
        setIsLoading(false);
      }
    };

    checkHydration();
  }, []);

  useEffect(() => {
    // Only show loading screen on first load of the session
    if (storesHydrated && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Mark that app has loaded in this session
        sessionStorage.setItem('app_loaded', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [storesHydrated, isLoading]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </>
  );
} 