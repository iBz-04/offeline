export {};

declare global {
  interface Window {
    omnibotAPI?: {
      openFile: () => Promise<{ path: string; content: string } | null>;
      saveFile: (opts: { fileName: string; data: string }) => Promise<{ ok: boolean; path?: string }>;
      openDevTools: () => void;
      
      ollama?: {
        isRunning: () => Promise<boolean>;
        listModels: () => Promise<Array<{
          name: string;
          size: number;
          digest: string;
          modified_at: string;
        }>>;
        pullModel: (modelName: string) => Promise<void>;
        deleteModel: (modelName: string) => Promise<void>;
        chat: (model: string, messages: Array<{ role: string; content: string }>) => Promise<string>;
        showModelInfo: (modelName: string) => Promise<any>;
        
        onReady: (callback: () => void) => () => void;
        onError: (callback: (error: string) => void) => () => void;
        onHealth: (callback: (running: boolean) => void) => () => void;
        onPullProgress: (callback: (progress: {
          model: string;
          status: string;
          completed: number;
          total: number;
        }) => void) => () => void;
        onChatToken: (callback: (token: string) => void) => () => void;
      };

      llamacpp?: {
        initialize: () => Promise<void>;
        listModels: () => Promise<Array<{
          name: string;
          path: string;
          size: number;
        }>>;
        loadModel: (modelPath: string) => Promise<void>;
        unloadModel: () => Promise<void>;
        chat: (messages: Array<{ role: string; content: string }>) => Promise<string>;
        chatWithSchema: (messages: Array<{ role: string; content: string }>, schema: any) => Promise<any>;
        getEmbedding: (text: string) => Promise<readonly number[]>;
        getModelsDirectory: () => Promise<string>;
        getCurrentModel: () => Promise<string | null>;
        isModelLoaded: () => Promise<boolean>;
        downloadModel: (url: string, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>;

        onReady: (callback: () => void) => () => void;
        onModelLoaded: (callback: (modelPath: string) => void) => () => void;
        onChatToken: (callback: (token: string) => void) => () => void;
        onDownloadProgress: (callback: (progress: {
          filename: string;
          downloaded: number;
          total: number;
          percent: number;
        }) => void) => () => void;
      };

      window?: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
    };
  }
}
