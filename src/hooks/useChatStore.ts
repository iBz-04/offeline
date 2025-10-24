import { Model, Models } from "@/lib/models";
import * as webllm from "@mlc-ai/web-llm";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Document } from "langchain/document";
import { MessageWithFiles } from "@/lib/types";

const LOCAL_SELECTED_MODEL = "selectedModel";

export type LLMBackend = 'webllm' | 'ollama' | 'llamacpp';

export interface InferenceSettings {
  contextWindowSize: number;
  maxTokens: number;
  temperature: number;
  topP: number;
}

interface State {
  selectedModel: Model;
  selectedBackend: LLMBackend;
  input: string;
  modelHasChanged: boolean;
  isLoading: boolean;
  isModelLoading: boolean;
  loadingError: string | null;
  messages: MessageWithFiles[];
  engine: webllm.MLCEngineInterface | null;
  fileText: Document<Record<string, any>>[] | null;
  files: File[] | undefined;
  base64Images: string[] | null;
  inferenceSettings: InferenceSettings;
}

interface Actions {
  setSelectedModel: (model: Model) => void;
  setSelectedBackend: (backend: LLMBackend) => void;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  setInput: (input: string) => void;
  setModelHasChanged: (changed: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsModelLoading: (loading: boolean) => void;
  setLoadingError: (error: string | null) => void;
  setMessages: (
    fn: (
      messages: MessageWithFiles[]
    ) => MessageWithFiles[]
  ) => void;
  setEngine: (engine: webllm.MLCEngineInterface | null) => void;
  setFileText: (text: Document<Record<string, any>>[] | null) => void;
  setFiles: (files: File[] | undefined) => void;
  setBase64Images: (base64Images: string[] | null) => void;
  setInferenceSettings: (settings: InferenceSettings) => void;
  resetState: () => void;
}

// Helper to detect if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).offlineAPI;
};

// Get default backend based on environment
const getDefaultBackend = (): LLMBackend => {
  return isElectron() ? 'ollama' : 'webllm';
};

const useChatStore = create<State & Actions>()(
  persist(
    (set) => ({
      selectedModel: Models[1] || Models[0], // Fallback to first model if Models[1] doesn't exist
      selectedBackend: getDefaultBackend(), // Ollama for desktop, WebLLM for web
      setSelectedModel: (model: Model) =>
        set((state: State) => ({
          selectedModel:
            state.selectedModel !== model ? model : state.selectedModel,
          modelHasChanged: true,
        })),
      setSelectedBackend: (backend: LLMBackend) => set({ selectedBackend: backend }),

      input: "",
      handleInputChange: (
        e:
          | React.ChangeEvent<HTMLInputElement>
          | React.ChangeEvent<HTMLTextAreaElement>
      ) => set({ input: e.target.value }),
      setInput: (input) => set({ input }),

      modelHasChanged: false,
      setModelHasChanged: (changed) => set({ modelHasChanged: changed }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      isModelLoading: false,
      setIsModelLoading: (loading) => set({ isModelLoading: loading }),

      loadingError: null,
      setLoadingError: (error) => set({ loadingError: error }),

      messages: [],
      setMessages: (fn) => set((state) => ({ messages: fn(state.messages) })),

      engine: null,
      setEngine: (engine) => set({ engine }),

      fileText: null,
      setFileText: (text) => set({ fileText: text }),

      files: undefined,
      setFiles: (files) => set({ files }),

      base64Images: null,
      setBase64Images: (base64Images) => set({ base64Images }),

      inferenceSettings: {
        contextWindowSize: 4096,
        maxTokens: 2048,
        temperature: 0.6,
        topP: 0.9,
      },
      setInferenceSettings: (settings) => set({ inferenceSettings: settings }),

      resetState: () => set({
        isLoading: false,
        isModelLoading: false,
        loadingError: null,
        input: "",
        fileText: null,
        files: undefined,
        base64Images: null,
      }),
    }),
    {
      name: LOCAL_SELECTED_MODEL,
      // Only save selectedModel, selectedBackend and inferenceSettings to local storage with partialize
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        selectedBackend: state.selectedBackend,
        inferenceSettings: state.inferenceSettings,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure selectedModel is always valid after rehydration
        if (!state?.selectedModel || !state.selectedModel.name) {
          console.warn('Invalid selectedModel after rehydration, resetting to default');
          state!.selectedModel = Models[1] || Models[0];
        }
        // Only set default backend if no backend was previously saved
        // This allows users to switch backends and have it persist
        if (!state?.selectedBackend) {
          const defaultBackend = getDefaultBackend();
          console.log('No saved backend, setting default:', defaultBackend);
          state!.selectedBackend = defaultBackend;
        } else {
          console.log('Using saved backend:', state.selectedBackend);
        }
      },
    }
  )
);

export default useChatStore;
