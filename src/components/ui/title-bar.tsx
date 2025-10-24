'use client';

import React, { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TitleBarProps {
  title?: string;
  icon?: React.ReactNode;
  showDragArea?: boolean;
}

export function TitleBar({ title = 'OmniBot', icon, showDragArea = true }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (typeof window !== 'undefined' && window.omnibotAPI?.window) {
        const maximized = await window.omnibotAPI.window.isMaximized();
        setIsMaximized(maximized ?? false);
      }
    };

    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    await window.omnibotAPI?.window?.minimize();
  };

  const handleMaximize = async () => {
    await window.omnibotAPI?.window?.maximize();
    const maximized = await window.omnibotAPI?.window?.isMaximized();
    setIsMaximized(maximized ?? false);
  };

  const handleClose = async () => {
    await window.omnibotAPI?.window?.close();
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between h-12 px-4 bg-background border-b border-border',
        'select-none transition-colors duration-200',
        showDragArea && 'drag-region'
      )}
      style={showDragArea ? { WebkitAppRegion: 'drag' } as any : undefined}
    >
      {/* Left side - Title and Icon */}
      <div className="flex items-center gap-2 min-w-0">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <span className="text-sm font-semibold text-foreground truncate">{title}</span>
      </div>

      {/* Right side - Window Controls */}
      <div className="flex items-center gap-1 ml-auto" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={handleMinimize}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-sm',
            'hover:bg-secondary text-foreground',
            'transition-colors duration-150 active:bg-accent'
          )}
          title="Minimize"
          aria-label="Minimize window"
        >
          <Minus size={16} strokeWidth={2} />
        </button>

        <button
          onClick={handleMaximize}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-sm',
            'hover:bg-secondary text-foreground',
            'transition-colors duration-150 active:bg-accent'
          )}
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        >
          <Square
            size={16}
            strokeWidth={2}
            fill={isMaximized ? 'currentColor' : 'none'}
          />
        </button>

        <button
          onClick={handleClose}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-sm',
            'hover:bg-destructive hover:text-destructive-foreground text-foreground',
            'transition-colors duration-150 active:bg-red-700'
          )}
          title="Close"
          aria-label="Close window"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
