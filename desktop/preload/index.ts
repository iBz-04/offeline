import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('omnibotAPI', {
  openFile: async () => {
    return await ipcRenderer.invoke('dialog:openFile');
  },
  saveFile: async (opts: { fileName: string; data: string }) => {
    return await ipcRenderer.invoke('dialog:saveFile', opts);
  },
  openDevTools: () => ipcRenderer.send('app:openDevTools'),
  
  ollama: {
    isRunning: () => ipcRenderer.invoke('ollama:isRunning'),
    listModels: () => ipcRenderer.invoke('ollama:listModels'),
    pullModel: (modelName: string) => ipcRenderer.invoke('ollama:pullModel', modelName),
    deleteModel: (modelName: string) => ipcRenderer.invoke('ollama:deleteModel', modelName),
    chat: (model: string, messages: any[]) => ipcRenderer.invoke('ollama:chat', { model, messages }),
    showModelInfo: (modelName: string) => ipcRenderer.invoke('ollama:showModelInfo', modelName),
    
    onReady: (callback: () => void) => {
      ipcRenderer.on('ollama:ready', callback);
      return () => ipcRenderer.removeListener('ollama:ready', callback);
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('ollama:error', (_event, error) => callback(error));
      return () => ipcRenderer.removeAllListeners('ollama:error');
    },
    onHealth: (callback: (running: boolean) => void) => {
      ipcRenderer.on('ollama:health', (_event, running) => callback(running));
      return () => ipcRenderer.removeAllListeners('ollama:health');
    },
    onPullProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('ollama:pullProgress', (_event, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('ollama:pullProgress');
    },
    onChatToken: (callback: (token: string) => void) => {
      ipcRenderer.on('ollama:chatToken', (_event, token) => callback(token));
      return () => ipcRenderer.removeAllListeners('ollama:chatToken');
    },
  },

  llamacpp: {
    initialize: () => ipcRenderer.invoke('llamacpp:initialize'),
    setOptions: (opts: {
      gpu?: 'auto' | 'cuda' | 'vulkan' | 'metal' | false;
      build?: 'auto' | 'never' | 'try' | 'forceRebuild';
      debug?: boolean;
      maxThreads?: number;
      reinitialize?: boolean;
    }) => ipcRenderer.invoke('llamacpp:setOptions', opts),
    listModels: () => ipcRenderer.invoke('llamacpp:listModels'),
    loadModel: (modelPath: string) => ipcRenderer.invoke('llamacpp:loadModel', modelPath),
    unloadModel: () => ipcRenderer.invoke('llamacpp:unloadModel'),
    chat: (messages: any[]) => ipcRenderer.invoke('llamacpp:chat', { messages }),
    chatWithSchema: (messages: any[], schema: any) => ipcRenderer.invoke('llamacpp:chatWithSchema', { messages, schema }),
    getEmbedding: (text: string) => ipcRenderer.invoke('llamacpp:getEmbedding', text),
    getModelsDirectory: () => ipcRenderer.invoke('llamacpp:getModelsDirectory'),
    getCurrentModel: () => ipcRenderer.invoke('llamacpp:getCurrentModel'),
    isModelLoaded: () => ipcRenderer.invoke('llamacpp:isModelLoaded'),
    downloadModel: (url: string, filename: string) => ipcRenderer.invoke('llamacpp:downloadModel', url, filename),

    onReady: (callback: () => void) => {
      ipcRenderer.on('llamacpp:ready', callback);
      return () => ipcRenderer.removeListener('llamacpp:ready', callback);
    },
    onModelLoaded: (callback: (modelPath: string) => void) => {
      ipcRenderer.on('llamacpp:modelLoaded', (_event, modelPath) => callback(modelPath));
      return () => ipcRenderer.removeAllListeners('llamacpp:modelLoaded');
    },
    onChatToken: (callback: (token: string) => void) => {
      ipcRenderer.on('llamacpp:chatToken', (_event, token) => callback(token));
      return () => ipcRenderer.removeAllListeners('llamacpp:chatToken');
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('llamacpp:downloadProgress', (_event, progress) => callback(progress));
      return () => ipcRenderer.removeAllListeners('llamacpp:downloadProgress');
    },
  },
});
