'use client';

import React, { useEffect, useState } from 'react';
import { TitleBar } from '@/components/ui/title-bar';
import { Cat } from 'lucide-react';

interface ElectronLayoutWrapperProps {
  children: React.ReactNode;
}

export function ElectronLayoutWrapper({ children }: ElectronLayoutWrapperProps) {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const isRunningInElectron = typeof window !== 'undefined' && !!(window as any).offlineAPI;
    setIsElectron(isRunningInElectron);
  }, []);

  if (!isElectron) {
    return <div className="h-screen w-screen flex flex-col overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TitleBar 
        title="Offeline" 
        icon={<Cat size={20} className="text-foreground" />}
      />
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
