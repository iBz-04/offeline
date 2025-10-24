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
    const isRunningInElectron = typeof window !== 'undefined' && !!(window as any).omnibotAPI;
    setIsElectron(isRunningInElectron);
  }, []);

  if (!isElectron) {
    return <div className="h-full w-full">{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen w-screen">
      <TitleBar 
        title="OmniBot" 
        icon={<Cat size={20} className="text-foreground" />}
      />
      <div className="flex-1 overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}
