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
});
