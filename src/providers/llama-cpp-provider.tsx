"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface GGUFModel {
  name: string;
  path: string;
  size: number;
}

interface LlamaCppContextType {
  isAvailable: boolean;
  isInitialized: boolean;
  models: GGUFModel[];
  currentModel: string | null;
  isModelLoaded: boolean;
  chatResponse: string;
  loading: boolean;
  error: string | null;
  modelsDirectory: string;
  setModel: (modelPath: string) => Promise<void>;
  refreshModels: () => Promise<void>;
  unloadModel: () => Promise<void>;
  chat: (messages: Array<{ role: string; content: string }>) => Promise<string>;
  chatWithSchema: (messages: Array<{ role: string; content: string }>, schema: any) => Promise<any>;
  getEmbedding: (text: string) => Promise<readonly number[]>;
  resetChatResponse: () => void;
}

const LlamaCppContext = createContext<LlamaCppContextType | null>(null);

export const useLlamaCpp = () => {
  const context = useContext(LlamaCppContext);
  if (!context) {
    throw new Error('useLlamaCpp must be used within LlamaCppProvider');
  }
  return context;
};

export const LlamaCppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [models, setModels] = useState<GGUFModel[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [chatResponse, setChatResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsDirectory, setModelsDirectory] = useState('');

  const refreshModels = useCallback(async () => {
    if (!window.offlineAPI?.llamacpp) return;
    
    try {
      setError(null);
      const modelList = await window.offlineAPI.llamacpp.listModels();
      setModels(modelList);
      
      const loaded = await window.offlineAPI.llamacpp.getCurrentModel();
      if (loaded) {
        setCurrentModel(loaded);
        setIsModelLoaded(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list models');
      console.error('List models error:', err);
    }
  }, []);

  const initializeLlamaCpp = useCallback(async () => {
    if (!window.offlineAPI?.llamacpp) return;
    
    try {
      setLoading(true);
      setError(null);
      await window.offlineAPI.llamacpp.initialize();
      setIsInitialized(true);
      const dir = await window.offlineAPI.llamacpp.getModelsDirectory();
      setModelsDirectory(dir);
      await refreshModels();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize llama.cpp');
      console.error('llama.cpp initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshModels]);

  const setupEventListeners = useCallback(() => {
    if (!window.offlineAPI?.llamacpp) return;

    window.offlineAPI.llamacpp.onReady(() => {
      setIsInitialized(true);
      setError(null);
    });

    window.offlineAPI.llamacpp.onModelLoaded((modelPath: string) => {
      setCurrentModel(modelPath);
      setIsModelLoaded(true);
      setError(null);
    });

    window.offlineAPI.llamacpp.onChatToken((token: string) => {
      setChatResponse(prev => prev + token);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.offlineAPI?.llamacpp) {
      setIsAvailable(true);
      initializeLlamaCpp();
      setupEventListeners();
    }
  }, [initializeLlamaCpp, setupEventListeners]);

  const setModel = useCallback(async (modelPath: string) => {
    if (!window.offlineAPI?.llamacpp) {
      throw new Error('llama.cpp not available');
    }

    try {
      setLoading(true);
      setError(null);
      
      if (isModelLoaded) {
        await window.offlineAPI.llamacpp.unloadModel();
        setIsModelLoaded(false);
      }

      await window.offlineAPI.llamacpp.loadModel(modelPath);
      setCurrentModel(modelPath);
      setIsModelLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load model');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isModelLoaded]);

  const unloadModel = useCallback(async () => {
    if (!window.offlineAPI?.llamacpp) return;

    try {
      setLoading(true);
      setError(null);
      await window.offlineAPI.llamacpp.unloadModel();
      setCurrentModel(null);
      setIsModelLoaded(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unload model');
      console.error('Unload model error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const chat = useCallback(async (messages: Array<{ role: string; content: string }>) => {
    if (!window.offlineAPI?.llamacpp || !isModelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      setLoading(true);
      setError(null);
      setChatResponse('');
      
      const response = await window.offlineAPI.llamacpp.chat(messages);
      setChatResponse(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Chat failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isModelLoaded]);

  const chatWithSchema = useCallback(async (
    messages: Array<{ role: string; content: string }>,
    schema: any
  ) => {
    if (!window.offlineAPI?.llamacpp || !isModelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await window.offlineAPI.llamacpp.chatWithSchema(messages, schema);
      return response;
    } catch (err: any) {
      setError(err.message || 'Schema chat failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isModelLoaded]);

  const getEmbedding = useCallback(async (text: string) => {
    if (!window.offlineAPI?.llamacpp || !isModelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      setError(null);
      const embedding = await window.offlineAPI.llamacpp.getEmbedding(text);
      return Array.from(embedding);
    } catch (err: any) {
      setError(err.message || 'Embedding generation failed');
      throw err;
    }
  }, [isModelLoaded]);

  const resetChatResponse = useCallback(() => {
    setChatResponse('');
  }, []);

  const value: LlamaCppContextType = {
    isAvailable,
    isInitialized,
    models,
    currentModel,
    isModelLoaded,
    chatResponse,
    loading,
    error,
    modelsDirectory,
    setModel,
    refreshModels,
    unloadModel,
    chat,
    chatWithSchema,
    getEmbedding,
    resetChatResponse,
  };

  return (
    <LlamaCppContext.Provider value={value}>
      {children}
    </LlamaCppContext.Provider>
  );
};
