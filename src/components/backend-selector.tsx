"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Check, Download, Trash2, RefreshCw } from "lucide-react";
import { useOllama } from "@/providers/ollama-provider";
import { Input } from "@/components/ui/input";

type LLMBackend = 'webllm' | 'ollama';

interface BackendSelectorProps {
  currentBackend: LLMBackend;
  onBackendChange: (backend: LLMBackend) => void;
}

export default function BackendSelector({ currentBackend, onBackendChange }: BackendSelectorProps) {
  const [open, setOpen] = useState(false);
  const [modelToPull, setModelToPull] = useState('');
  const ollama = useOllama();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePullModel = async () => {
    if (!modelToPull.trim()) return;
    await ollama.pullModel(modelToPull.trim());
    setModelToPull('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          {currentBackend === 'webllm' ? 'WebLLM' : 'Ollama'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>LLM Backend Settings</DialogTitle>
          <DialogDescription>
            Choose between WebLLM (browser-based) or Ollama (native performance)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">Select Backend</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={currentBackend === 'webllm' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => onBackendChange('webllm')}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-semibold">WebLLM</span>
                  {currentBackend === 'webllm' && <Check className="w-4 h-4 ml-auto" />}
                </div>
                <span className="text-xs text-left opacity-70">
                  Browser-based • WebGPU • Same as web version
                </span>
              </Button>

              <Button
                variant={currentBackend === 'ollama' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => onBackendChange('ollama')}
                disabled={!ollama.isAvailable}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-semibold">Ollama</span>
                  {currentBackend === 'ollama' && <Check className="w-4 h-4 ml-auto" />}
                </div>
                <span className="text-xs text-left opacity-70">
                  {ollama.isAvailable 
                    ? 'Native • GPU acceleration • Better performance'
                    : 'Not available in web mode'}
                </span>
              </Button>
            </div>
          </div>

          {ollama.isAvailable && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Ollama Status</h3>
                <span className={`text-xs px-2 py-1 rounded ${ollama.isRunning ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                  {ollama.isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>

              {ollama.error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                  {ollama.error}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Available Models</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={ollama.refreshModels}
                    disabled={ollama.loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${ollama.loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="h-48 border rounded-md p-2 overflow-y-auto">
                  {ollama.models.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No models installed
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ollama.models.map((model) => (
                        <div
                          key={model.digest}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatBytes(model.size)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {ollama.currentModel === model.name && (
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Active
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => ollama.setModel(model.name)}
                            >
                              Select
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => ollama.deleteModel(model.name)}
                              disabled={ollama.loading}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Pull New Model</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., llama3.2, qwen2.5:0.5b"
                    value={modelToPull}
                    onChange={(e) => setModelToPull(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
                  />
                  <Button
                    onClick={handlePullModel}
                    disabled={ollama.loading || !modelToPull.trim()}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                {ollama.pullProgress && (
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>{ollama.pullProgress.status}</span>
                      <span>
                        {Math.round((ollama.pullProgress.completed / ollama.pullProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${(ollama.pullProgress.completed / ollama.pullProgress.total) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
