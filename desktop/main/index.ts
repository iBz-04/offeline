import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { OllamaManager } from './ollama-manager';

if ((process as any).env.ELECTRON_DISABLE_SANDBOX) {
  app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;
const ollamaManager = new OllamaManager();

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
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
  try {
    app.commandLine.appendSwitch('enable-unsafe-webgpu');
  } catch (err) {
    // ignore
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
