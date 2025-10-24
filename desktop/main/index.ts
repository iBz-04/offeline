import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { OllamaManager } from './ollama-manager';
import { LlamaCppManager } from './llama-cpp-manager';


// WebLLM requires WebGPU which needs GPU acceleration
// Only disable if absolutely necessary for debugging
// if ((process as any).env.ELECTRON_DISABLE_SANDBOX) {
//   app.disableHardwareAcceleration();
// }

let mainWindow: BrowserWindow | null = null;
const ollamaManager = new OllamaManager();
const llamaCppManager = new LlamaCppManager();

ollamaManager.on('ready', () => {
  mainWindow?.webContents.send('ollama:ready');
});

ollamaManager.on('error', (error: string) => {
  mainWindow?.webContents.send('ollama:error', error);
});

ollamaManager.on('health', (running: boolean) => {
  mainWindow?.webContents.send('ollama:health', running);
});

ollamaManager.on('pullProgress', (progress: any) => {
  mainWindow?.webContents.send('ollama:pullProgress', progress);
});

ollamaManager.on('chatToken', (token: string) => {
  mainWindow?.webContents.send('ollama:chatToken', token);
});

llamaCppManager.on('ready', () => {
  mainWindow?.webContents.send('llamacpp:ready');
});

llamaCppManager.on('modelLoaded', (modelPath: string) => {
  mainWindow?.webContents.send('llamacpp:modelLoaded', modelPath);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, '..', '..', 'public', 'cat_logo.png'),
    frame: false, // Remove native frame for custom styling
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Enable WebGPU support for WebLLM
      experimentalFeatures: true,
    },
  });

  const devUrl = 'http://localhost:3001';
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production we'll hit the packaged renderer server (to be implemented)
    mainWindow.loadURL(devUrl);
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Enable WebGPU for WebLLM support
  try {
    app.commandLine.appendSwitch('enable-unsafe-webgpu');
    app.commandLine.appendSwitch('enable-features', 'Vulkan');
    // Ensure GPU process is enabled
    app.commandLine.appendSwitch('ignore-gpu-blocklist');
  } catch (err) {
    console.error('Failed to enable WebGPU:', err);
  }
  
  ollamaManager.start().catch(err => {
    console.error('Failed to start Ollama:', err);
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await ollamaManager.stop();
  await llamaCppManager.dispose();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC handlers
ipcMain.handle('dialog:openFile', async (_event, _args) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
  });
  if (canceled || filePaths.length === 0) return null;
  const filePath = filePaths[0];
  const content = fs.readFileSync(filePath, 'utf8');
  return { path: filePath, content };
});

ipcMain.handle('dialog:saveFile', async (_event, { fileName, data }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: fileName,
  });
  if (canceled || !filePath) return { ok: false };
  fs.writeFileSync(filePath, data, 'utf8');
  return { ok: true, path: filePath };
});

ipcMain.handle('ollama:isRunning', async () => {
  return await ollamaManager.isRunning();
});

ipcMain.handle('ollama:listModels', async () => {
  return await ollamaManager.listModels();
});

ipcMain.handle('ollama:pullModel', async (_event, modelName: string) => {
  await ollamaManager.pullModel(modelName);
});

ipcMain.handle('ollama:deleteModel', async (_event, modelName: string) => {
  await ollamaManager.deleteModel(modelName);
});

ipcMain.handle('ollama:chat', async (_event, { model, messages }) => {
  return await ollamaManager.chat(model, messages, true);
});

ipcMain.handle('ollama:showModelInfo', async (_event, modelName: string) => {
  return await ollamaManager.showModelInfo(modelName);
});

ipcMain.handle('llamacpp:initialize', async () => {
  await llamaCppManager.initialize();
});

ipcMain.handle('llamacpp:setOptions', async (_event, opts: {
  gpu?: 'auto' | 'cuda' | 'vulkan' | 'metal' | false;
  build?: 'auto' | 'never' | 'try' | 'forceRebuild';
  debug?: boolean;
  maxThreads?: number;
  reinitialize?: boolean;
}) => {
  await llamaCppManager.setOptions(opts);
});

ipcMain.handle('llamacpp:listModels', async () => {
  return await llamaCppManager.listModels();
});

ipcMain.handle('llamacpp:loadModel', async (_event, modelPath: string) => {
  await llamaCppManager.loadModel(modelPath);
});

ipcMain.handle('llamacpp:unloadModel', async () => {
  await llamaCppManager.unloadModel();
});

ipcMain.handle('llamacpp:chat', async (_event, { messages }) => {
  return await llamaCppManager.chat(messages, (token: string) => {
    mainWindow?.webContents.send('llamacpp:chatToken', token);
  });
});

ipcMain.handle('llamacpp:chatWithSchema', async (_event, { messages, schema }) => {
  return await llamaCppManager.chatWithSchema(messages, schema, (token: string) => {
    mainWindow?.webContents.send('llamacpp:chatToken', token);
  });
});

ipcMain.handle('llamacpp:getEmbedding', async (_event, text: string) => {
  return await llamaCppManager.getEmbedding(text);
});

ipcMain.handle('llamacpp:getModelsDirectory', () => {
  return llamaCppManager.getModelsDirectory();
});

ipcMain.handle('llamacpp:getCurrentModel', () => {
  return llamaCppManager.getCurrentModel();
});

ipcMain.handle('llamacpp:isModelLoaded', () => {
  return llamaCppManager.isModelLoaded();
});

ipcMain.handle('llamacpp:downloadModel', async (_event, url: string, filename: string) => {
  console.log('[Main] Download requested:', { url, filename });
  
  const modelsDir = llamaCppManager.getModelsDirectory();
  console.log('[Main] Models directory:', modelsDir);
  
  await fs.promises.mkdir(modelsDir, { recursive: true });
  
  const destPath = path.join(modelsDir, filename);
  console.log('[Main] Destination path:', destPath);
  
  return new Promise<{ success: boolean; path?: string; error?: string }>((resolve) => {
    const downloadWithRedirect = (downloadUrl: string, maxRedirects = 5) => {
      console.log('[Main] Downloading from:', downloadUrl);
      
      if (maxRedirects === 0) {
        console.error('[Main] Too many redirects');
        resolve({ success: false, error: 'Too many redirects' });
        return;
      }

      const lib = downloadUrl.startsWith('https') ? https : http;
      const req = lib.get(downloadUrl, (res) => {
        console.log('[Main] Response status:', res.statusCode);
        
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log('[Main] Redirecting to:', res.headers.location);
          downloadWithRedirect(res.headers.location, maxRedirects - 1);
          return;
        }

        if (res.statusCode !== 200) {
          console.error('[Main] HTTP error:', res.statusCode);
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
          return;
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        
        console.log('[Main] Starting download, total bytes:', totalBytes);

        const fileStream = fs.createWriteStream(destPath);
        
        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0) {
            const percent = Math.round((downloadedBytes / totalBytes) * 100);
            mainWindow?.webContents.send('llamacpp:downloadProgress', {
              filename,
              downloaded: downloadedBytes,
              total: totalBytes,
              percent,
            });
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log('[Main] Download complete:', destPath);
          resolve({ success: true, path: destPath });
        });

        fileStream.on('error', (err) => {
          console.error('[Main] File stream error:', err);
          fs.unlink(destPath, () => {});
          resolve({ success: false, error: err.message });
        });
      });

      req.on('error', (err) => {
        console.error('[Main] Request error:', err);
        resolve({ success: false, error: err.message });
      });
    };

    downloadWithRedirect(url);
  });
});

// Window control IPC handlers
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() || false;
});
