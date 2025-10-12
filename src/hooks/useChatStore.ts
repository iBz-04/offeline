import { Model, Models } from "@/lib/models";
import * as webllm from "@mlc-ai/web-llm";
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
  messages: MessageWithFiles[];
  engine: webllm.MLCEngineInterface | null;
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
}

const useChatStore = create<State & Actions>()(
  persist(
    (set) => ({
      selectedModel: Models[1], // Qwen2.5 1.5B - Recommended
      setSelectedModel: (model: Model) =>
        set((state: State) => ({
          selectedModel:
            state.selectedModel !== model ? model : state.selectedModel,
          modelHasChanged: true,
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
      setInferenceSettings: (settings) => set({ inferenceSettings: settings })
    }),
    {
      name: LOCAL_SELECTED_MODEL,
      // Only save selectedModel and inferenceSettings to local storage with partialize
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        inferenceSettings: state.inferenceSettings,
      }),
    }
  )
);

export default useChatStore;
