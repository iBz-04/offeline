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
import { Settings, Check, Download, Trash2, RefreshCw, Folder } from "lucide-react";
import { useOllama } from "@/providers/ollama-provider";
import { useLlamaCpp } from "@/providers/llama-cpp-provider";
import { Input } from "@/components/ui/input";

type LLMBackend = 'webllm' | 'ollama' | 'llamacpp';

interface BackendSelectorProps {
  currentBackend: LLMBackend;
  onBackendChange: (backend: LLMBackend) => void;
}

const RECOMMENDED_MODELS = [
  { name: 'qwen2.5:0.5b', size: '397 MB', description: 'Ultra-fast, great for quick responses' },
  { name: 'qwen2.5:1.5b', size: '934 MB', description: 'Balanced speed and quality' },
  { name: 'llama3.2:1b', size: '1.3 GB', description: 'Fast and capable' },
  { name: 'phi3.5:3.8b', size: '2.2 GB', description: 'High quality (slightly larger)' },
];

export default function BackendSelector({ currentBackend, onBackendChange }: BackendSelectorProps) {
  const [open, setOpen] = useState(false);
  const [modelToPull, setModelToPull] = useState('');
  const [showRecommended, setShowRecommended] = useState(true);
  const ollama = useOllama();
  const llamacpp = useLlamaCpp();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isModelInstalled = (modelName: string): boolean => {
    return ollama.models.some(m => m.name === modelName);
  };

  const handlePullModel = async (modelName?: string) => {
    const model = modelName || modelToPull.trim();
    if (!model || isModelInstalled(model)) return;
    await ollama.pullModel(model);
    setModelToPull('');
    setShowRecommended(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          {currentBackend === 'webllm' ? 'WebLLM' : currentBackend === 'ollama' ? 'Ollama' : 'llama.cpp'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>LLM Backend Settings</DialogTitle>
          <DialogDescription>
            Choose between WebLLM (browser-based) or Ollama (native performance)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2 max-h-[calc(85vh-8rem)]">
          <div className="space-y-3">
            <h3 className="font-semibold">Select Backend</h3>
            <div className="grid grid-cols-3 gap-3">
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
                  Browser-based • WebGPU
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
                    ? 'Server • Auto GPU'
                    : 'Desktop only'}
                </span>
              </Button>

              <Button
                variant={currentBackend === 'llamacpp' ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => onBackendChange('llamacpp')}
                disabled={!llamacpp.isAvailable}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-semibold">llama.cpp</span>
                  {currentBackend === 'llamacpp' && <Check className="w-4 h-4 ml-auto" />}
                </div>
                <span className="text-xs text-left opacity-70">
                  {llamacpp.isAvailable 
                    ? 'Direct • Advanced'
                    : 'Desktop only'}
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
                
                {/* Recommended Models */}
                {showRecommended && (
                  <div className="space-y-2 mb-3 p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Recommended (under 1.5GB)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setShowRecommended(false)}
                      >
                        Hide
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {RECOMMENDED_MODELS.map((model) => {
                        const isInstalled = isModelInstalled(model.name);
                        return (
                          <div
                            key={model.name}
                            className="flex items-center justify-between p-2 bg-background rounded border hover:border-primary transition-colors"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">{model.name}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{model.size}</span>
                              {isInstalled ? (
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Installed
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7"
                                  onClick={() => handlePullModel(model.name)}
                                  disabled={ollama.loading}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Pull
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {!showRecommended && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowRecommended(true)}
                  >
                    Show recommended models
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., llama3.2, qwen2.5:0.5b"
                    value={modelToPull}
                    onChange={(e) => setModelToPull(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
                  />
                  <Button
                    onClick={() => handlePullModel()}
                    disabled={ollama.loading || !modelToPull.trim()}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                {ollama.pullProgress && (
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="truncate">{ollama.pullProgress.status}</span>
                      <span className="ml-2">
                        {ollama.pullProgress.total > 0 
                          ? Math.round((ollama.pullProgress.completed / ollama.pullProgress.total) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${ollama.pullProgress.total > 0 
                            ? Math.min(100, (ollama.pullProgress.completed / ollama.pullProgress.total) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {llamacpp.isAvailable && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">llama.cpp Status</h3>
                <span className={`text-xs px-2 py-1 rounded ${llamacpp.isInitialized ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                  {llamacpp.isInitialized ? 'Ready' : 'Initializing'}
                </span>
              </div>

              {llamacpp.error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                  {llamacpp.error}
                </div>
              )}

              {llamacpp.modelsDirectory && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded flex items-start gap-2">
                  <Folder className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="break-all">{llamacpp.modelsDirectory}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">GGUF Models</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={llamacpp.refreshModels}
                    disabled={llamacpp.loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${llamacpp.loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="h-48 border rounded-md p-2 overflow-y-auto">
                  {llamacpp.models.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      <p>No GGUF models found</p>
                      <p className="text-xs mt-2">Place .gguf files in the models directory</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {llamacpp.models.map((model) => (
                        <div
                          key={model.path}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{model.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatBytes(model.size)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {llamacpp.currentModel === model.path && (
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Loaded
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => llamacpp.setModel(model.path)}
                              disabled={llamacpp.loading}
                            >
                              Load
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {llamacpp.isModelLoaded && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={llamacpp.unloadModel}
                    disabled={llamacpp.loading}
                  >
                    Unload Model
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
