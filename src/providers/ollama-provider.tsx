"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface PullProgress {
  model: string;
  status: string;
  completed: number;
  total: number;
}

interface OllamaContextType {
  isAvailable: boolean;
  isRunning: boolean;
  models: OllamaModel[];
  currentModel: string | null;
  pullProgress: PullProgress | null;
  chatResponse: string;
  loading: boolean;
  error: string | null;
  setModel: (model: string) => void;
  refreshModels: () => Promise<void>;
  pullModel: (modelName: string) => Promise<void>;
  deleteModel: (modelName: string) => Promise<void>;
  chat: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  resetChatResponse: () => void;
}

const OllamaContext = createContext<OllamaContextType | null>(null);

export const useOllama = () => {
  const context = useContext(OllamaContext);
  if (!context) {
    throw new Error('useOllama must be used within OllamaProvider');
  }
  return context;
};

export const OllamaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [chatResponse, setChatResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshModels = useCallback(async () => {
    if (!window.omnibotAPI?.ollama) return;
    
    try {
      const modelList = await window.omnibotAPI.ollama.listModels();
      setModels(modelList);
      if (modelList.length > 0 && !currentModel) {
        setCurrentModel(modelList[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    }
  }, [currentModel]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.omnibotAPI?.ollama) return;

    setIsAvailable(true);

    const checkRunning = async () => {
      const running = await window.omnibotAPI!.ollama!.isRunning();
      setIsRunning(running);
      if (running) {
        refreshModels();
      }
    };

    checkRunning();

    const unsubReady = window.omnibotAPI.ollama.onReady(() => {
      setIsRunning(true);
      refreshModels();
    });

    const unsubError = window.omnibotAPI.ollama.onError((error) => {
      setError(error);
      setIsRunning(false);
    });

    const unsubHealth = window.omnibotAPI.ollama.onHealth((running) => {
      setIsRunning(running);
    });

    const unsubPullProgress = window.omnibotAPI.ollama.onPullProgress((progress) => {
      setPullProgress(progress);
    });

    const unsubChatToken = window.omnibotAPI.ollama.onChatToken((token) => {
      setChatResponse(prev => prev + token);
    });

    return () => {
      unsubReady();
      unsubError();
      unsubHealth();
      unsubPullProgress();
      unsubChatToken();
    };
  }, [refreshModels]);

  const pullModel = async (modelName: string) => {
    if (!window.omnibotAPI?.ollama) return;
    
    setLoading(true);
    setError(null);
    try {
      await window.omnibotAPI.ollama.pullModel(modelName);
      await refreshModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull model');
    } finally {
      setLoading(false);
      setPullProgress(null);
    }
  };

  const deleteModel = async (modelName: string) => {
    if (!window.omnibotAPI?.ollama) return;
    
    setLoading(true);
    setError(null);
    try {
      await window.omnibotAPI.ollama.deleteModel(modelName);
      if (currentModel === modelName) {
        setCurrentModel(null);
      }
      await refreshModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete model');
    } finally {
      setLoading(false);
    }
  };

  const chat = async (messages: Array<{ role: string; content: string }>) => {
    if (!window.omnibotAPI?.ollama || !currentModel) {
      throw new Error('Ollama not available or no model selected');
    }
    
    setChatResponse('');
    setError(null);
    
    try {
      const response = await window.omnibotAPI.ollama.chat(currentModel, messages);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Chat failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const resetChatResponse = () => {
    setChatResponse('');
  };

  const value: OllamaContextType = {
    isAvailable,
    isRunning,
    models,
    currentModel,
    pullProgress,
    chatResponse,
    loading,
    error,
    setModel: setCurrentModel,
    refreshModels,
    pullModel,
    deleteModel,
    chat,
    resetChatResponse,
  };

  return <OllamaContext.Provider value={value}>{children}</OllamaContext.Provider>;
};
