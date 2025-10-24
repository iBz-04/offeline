"use client";

import React, { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import * as webllm from "@mlc-ai/web-llm";
import { Button } from "../ui/button";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Sidebar } from "../sidebar";
import { Message } from "ai/react";
import useChatStore from "@/hooks/useChatStore";
import { Models, Model } from "@/lib/models";
import { ModelBadge } from "../ui/model-badge";
import { InfoIcon } from "lucide-react";
import BackendSelector from "../backend-selector";
import { useOllama } from "@/providers/ollama-provider";
import { useLlamaCpp } from "@/providers/llama-cpp-provider";

interface ChatTopbarProps {
  chatId?: string;
  stopAction: () => void;
}

export default function ChatTopbar({ chatId, stopAction }: ChatTopbarProps) {
  const [open, setOpen] = React.useState(false);

  // Zustand store
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const isLoading = useChatStore((state) => state.isLoading);
  const selectedBackend = useChatStore((state) => state.selectedBackend);
  const setSelectedBackend = useChatStore((state) => state.setSelectedBackend);

  const ollama = useOllama();
  const llamacpp = useLlamaCpp();

  const currentDisplayName = selectedBackend === 'ollama' 
    ? (ollama.currentModel || 'No Ollama model selected')
    : selectedBackend === 'llamacpp'
    ? (llamacpp.currentModel?.split('/').pop()?.split('\\').pop() || 'No model loaded')
    : selectedModel.displayName;

  return (
    <div className="w-full flex px-4 py-6  items-center justify-between lg:justify-center ">
      <Sheet>
        <SheetTrigger>
          <HamburgerMenuIcon className="md:hidden w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left">
          <Sidebar chatId={chatId || ""} isCollapsed={false} stopAction={stopAction} />
        </SheetContent>
      </Sheet>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] md:w-[300px] justify-between bg-accent dark:bg-card"
          >
            <div className="flex gap-2 items-center truncate">
              <p className="truncate">{currentDisplayName}</p>
              {selectedBackend === 'webllm' && selectedModel.badge && (
                <ModelBadge color={selectedModel.badgeColor}>{selectedModel.badge}</ModelBadge>
              )}
            </div>
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] md:w-[300px] max-h-96 overflow-y-scroll p-1">
          {selectedBackend === 'webllm' ? (
            <>
              {/* Performance Color Legend - only for WebLLM */}
              <div className="p-2 mb-2 border-b text-xs text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <InfoIcon className="w-3 h-3" />
                  <span className="font-medium">Performance Guide:</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-red-500"></div>
                    <span>Ultra Fast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-yellow-500"></div>
                    <span>Fast</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-green-500"></div>
                    <span>Balanced</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded bg-blue-500"></div>
                    <span>Quality</span>
                  </div>
                </div>
              </div>
              
              {/* WebLLM Models */}
              {Models.map((model) => (
                <Button
                  key={model.name}
                  variant="ghost"
                  className="w-full justify-start flex gap-2 items-center truncate"
                  onClick={() => {
                    setSelectedModel(model);
                    setOpen(false);
                  }}
                >
                  {model.displayName}
                  {model.badge && (
                    <ModelBadge color={model.badgeColor}>
                      {model.badge}
                    </ModelBadge>
                  )}
                </Button>
              ))}
            </>
          ) : selectedBackend === 'ollama' ? (
            <>
              <div className="p-2 mb-2 border-b text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <InfoIcon className="w-3 h-3" />
                  <span className="font-medium">Ollama Models</span>
                </div>
              </div>
              
              {ollama.models.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No models available. Pull a model using the Backend Selector.
                </div>
              ) : (
                ollama.models.map((model) => (
                  <Button
                    key={model.name}
                    variant="ghost"
                    className="w-full justify-start flex gap-2 items-center truncate"
                    onClick={() => {
                      ollama.setModel(model.name);
                      setOpen(false);
                    }}
                  >
                    {model.name}
                  </Button>
                ))
              )}
            </>
          ) : (
            <>
              <div className="p-2 mb-2 border-b text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <InfoIcon className="w-3 h-3" />
                  <span className="font-medium">llama.cpp GGUF Models</span>
                </div>
              </div>
              
              {llamacpp.models.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No GGUF models found. Place .gguf files in the models directory.
                </div>
              ) : (
                llamacpp.models.map((model) => (
                  <Button
                    key={model.path}
                    variant="ghost"
                    className="w-full justify-start flex gap-2 items-center truncate"
                    onClick={async () => {
                      await llamacpp.setModel(model.path);
                      setOpen(false);
                    }}
                  >
                    {model.name}
                  </Button>
                ))
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
      
      {/* Backend Selector for Desktop - only show if running in Electron */}
      <div className="flex items-center gap-2">
        {typeof window !== "undefined" && (window as any).offlineAPI && (
          <BackendSelector 
            currentBackend={selectedBackend}
            onBackendChange={setSelectedBackend}
          />
        )}
      </div>
    </div>
  );
}
