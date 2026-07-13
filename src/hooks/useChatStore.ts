import { DefaultModel, findModelByName, Model } from "@/lib/models";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Document } from "langchain/document";
import { MessageWithFiles } from "@/lib/types";

const LOCAL_SELECTED_MODEL = "selectedModel";

export interface InferenceSettings {
  contextWindowSize: number;
  maxTokens: number;
  temperature: number;
  topP: number;
}

interface State {
  selectedModel: Model;
  input: string;
  modelHasChanged: boolean;
  isLoading: boolean;
  isModelLoading: boolean;
  modelLoadProgress: number | null;
  modelLoadStatus: string | null;
  loadingError: string | null;
  messages: MessageWithFiles[];
  engine: MLCEngineInterface | null;
  fileText: Document<Record<string, any>>[] | null;
  files: File[] | undefined;
  base64Images: string[] | null;
  inferenceSettings: InferenceSettings;
}

interface Actions {
  setSelectedModel: (model: Model) => void;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  setInput: (input: string) => void;
  setModelHasChanged: (changed: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsModelLoading: (loading: boolean) => void;
  setModelLoadProgress: (progress: number | null) => void;
  setModelLoadStatus: (status: string | null) => void;
  setLoadingError: (error: string | null) => void;
  setMessages: (
    fn: (
      messages: MessageWithFiles[]
    ) => MessageWithFiles[]
  ) => void;
  setEngine: (engine: MLCEngineInterface | null) => void;
  setFileText: (text: Document<Record<string, any>>[] | null) => void;
  setFiles: (files: File[] | undefined) => void;
  setBase64Images: (base64Images: string[] | null) => void;
  setInferenceSettings: (settings: InferenceSettings) => void;
  resetState: () => void;
}

const useChatStore = create<State & Actions>()(
  persist(
    (set) => ({
      selectedModel: DefaultModel,
      setSelectedModel: (model: Model) =>
        set((state: State) => ({
          selectedModel: state.selectedModel !== model ? model : state.selectedModel,
          modelHasChanged: state.selectedModel !== model,
        })),

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

      modelLoadProgress: null,
      setModelLoadProgress: (progress) => set({ modelLoadProgress: progress }),

      modelLoadStatus: null,
      setModelLoadStatus: (status) => set({ modelLoadStatus: status }),

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
        modelLoadProgress: null,
        modelLoadStatus: null,
        loadingError: null,
        input: "",
        fileText: null,
        files: undefined,
        base64Images: null,
      }),
    }),
    {
      name: LOCAL_SELECTED_MODEL,
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        inferenceSettings: state.inferenceSettings,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        const persistedModel = state?.selectedModel?.name
          ? findModelByName(state.selectedModel.name)
          : undefined;
        state!.selectedModel = persistedModel ?? DefaultModel;
      },
    }
  )
);

export default useChatStore;
