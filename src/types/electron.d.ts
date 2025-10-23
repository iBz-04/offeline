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
    };
  }
}
