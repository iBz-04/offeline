# LLM Engine Integration Plan for OmniBot Desktop

This document outlines the strategy for integrating multiple LLM backends (WebLLM, Ollama, and llama.cpp) in the OmniBot desktop client, with a focus on hardware acceleration, privacy, and performance.

## Current State (Web Version)

The web version uses **WebLLM** exclusively:
- Runs models via WebGPU in the browser
- Models cached in IndexedDB
- Zero server dependencies
- Privacy-first (all processing client-side)
- Limited to browser WebGPU capabilities

## Desktop Integration Strategy

### Three-Tier Approach

1. **WebLLM (Default)** - Browser-based, same as web version
2. **Ollama (Recommended for Desktop)** - Native performance with easy model management
3. **llama.cpp (Advanced/Fallback)** - Direct integration for maximum control

---

## 1. WebLLM Integration (Default)

### Advantages
- ✅ Code reuse from web version (zero refactor)
- ✅ Same UI/UX across web and desktop
- ✅ No additional dependencies
- ✅ Models cached in Electron's IndexedDB

### Implementation
Already implemented. The Electron renderer can use the existing `WebLLMProvider` without changes.

### Hardware Acceleration
- Uses Chromium's WebGPU implementation
- May require Electron flags: `--enable-unsafe-webgpu`
- Limited to WebGPU-compatible hardware

---

## 2. Ollama Integration (Recommended)

### Why Ollama for Desktop?

**Advantages:**
- ✅ **Easiest to use** - Download executable, install models with one command
- ✅ **Better performance** - Native code, optimized for CPU/GPU
- ✅ **Automatic hardware acceleration** - CUDA, Metal, ROCm, Vulkan support
- ✅ **Model management** - Built-in model registry and versioning
- ✅ **REST API** - Simple HTTP interface
- ✅ **Cross-platform** - Windows, macOS, Linux binaries available
- ✅ **Active ecosystem** - Large community, many integrations

**Use Cases:**
- Primary desktop backend for users who want maximum performance
- Larger models that don't fit in WebGPU memory limits
- Users with NVIDIA GPUs (CUDA acceleration)
- Apple Silicon Macs (Metal acceleration)

### Architecture

```
┌─────────────────────────────────────────┐
│   Electron Renderer (React UI)         │
│   ├─ Chat Components                   │
│   ├─ Model Selector                    │
│   └─ Settings                           │
└─────────────────────────────────────────┘
                   │
                   │ IPC Bridge
                   ▼
┌─────────────────────────────────────────┐
│   Electron Main Process                 │
│   ├─ Ollama Manager Service            │
│   │  ├─ Start/Stop Ollama Server       │
│   │  ├─ Model Download/List/Delete     │
│   │  └─ Health Checks                  │
│   └─ IPC Handlers                       │
└─────────────────────────────────────────┘
                   │
                   │ HTTP (localhost:11434)
                   ▼
┌─────────────────────────────────────────┐
│   Ollama Server (Native Binary)         │
│   ├─ llama.cpp backend                 │
│   ├─ Model Runtime                      │
│   └─ Hardware Acceleration              │
│      ├─ CUDA (NVIDIA)                   │
│      ├─ Metal (Apple)                   │
│      ├─ ROCm (AMD)                      │
│      └─ Vulkan (fallback)               │
└─────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Ollama Manager Service (Main Process)

Create `desktop/main/ollama-manager.ts`:

```typescript
import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';

export class OllamaManager {
  private process: ChildProcess | null = null;
  private readonly apiUrl = 'http://localhost:11434';
  
  async start(): Promise<void> {
    // Check if Ollama is already running
    if (await this.isRunning()) {
      console.log('Ollama is already running');
      return;
    }
    
    // Start Ollama server
    this.process = spawn('ollama', ['serve']);
    
    // Wait for server to be ready
    await this.waitForReady();
  }
  
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
  
  async isRunning(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }
  
  async listModels(): Promise<string[]> {
    const response = await axios.get(`${this.apiUrl}/api/tags`);
    return response.data.models.map(m => m.name);
  }
  
  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
    const response = await axios.post(`${this.apiUrl}/api/pull`, 
      { name: modelName },
      { responseType: 'stream' }
    );
    
    response.data.on('data', (chunk: Buffer) => {
      const data = JSON.parse(chunk.toString());
      if (onProgress && data.completed && data.total) {
        onProgress((data.completed / data.total) * 100);
      }
    });
  }
  
  async chat(model: string, messages: any[], onToken?: (token: string) => void): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}/api/chat`,
      { model, messages, stream: true },
      { responseType: 'stream' }
    );
    
    let fullResponse = '';
    
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        const data = JSON.parse(chunk.toString());
        if (data.message?.content) {
          fullResponse += data.message.content;
          onToken?.(data.message.content);
        }
        if (data.done) {
          resolve(fullResponse);
        }
      });
      
      response.data.on('error', reject);
    });
  }
}
```

#### Step 2: IPC Handlers (Main Process)

Add to `desktop/main/index.ts`:

```typescript
import { OllamaManager } from './ollama-manager';

const ollamaManager = new OllamaManager();

// Start Ollama when app starts
app.on('ready', async () => {
  try {
    await ollamaManager.start();
  } catch (err) {
    console.error('Failed to start Ollama:', err);
  }
  createWindow();
});

// Stop Ollama when app quits
app.on('before-quit', async () => {
  await ollamaManager.stop();
});

// IPC handlers
ipcMain.handle('ollama:listModels', async () => {
  return await ollamaManager.listModels();
});

ipcMain.handle('ollama:pullModel', async (_event, modelName: string) => {
  return await ollamaManager.pullModel(modelName, (progress) => {
    mainWindow?.webContents.send('ollama:pullProgress', progress);
  });
});

ipcMain.handle('ollama:chat', async (_event, { model, messages }) => {
  return await ollamaManager.chat(model, messages, (token) => {
    mainWindow?.webContents.send('ollama:token', token);
  });
});
```

#### Step 3: Preload Bridge

Add to `desktop/preload/index.ts`:

```typescript
contextBridge.exposeInMainWorld('omnibotAPI', {
  // ... existing APIs
  ollama: {
    listModels: () => ipcRenderer.invoke('ollama:listModels'),
    pullModel: (modelName: string) => ipcRenderer.invoke('ollama:pullModel', modelName),
    chat: (model: string, messages: any[]) => ipcRenderer.invoke('ollama:chat', { model, messages }),
    onPullProgress: (callback: (progress: number) => void) => {
      ipcRenderer.on('ollama:pullProgress', (_event, progress) => callback(progress));
    },
    onToken: (callback: (token: string) => void) => {
      ipcRenderer.on('ollama:token', (_event, token) => callback(token));
    },
  },
});
```

#### Step 4: React Provider (Renderer)

Create `src/providers/ollama-provider.tsx`:

```typescript
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface OllamaContextType {
  isAvailable: boolean;
  models: string[];
  currentModel: string | null;
  setModel: (model: string) => void;
  chat: (messages: any[]) => Promise<string>;
}

const OllamaContext = createContext<OllamaContextType | null>(null);

export const useOllama = () => {
  const context = useContext(OllamaContext);
  if (!context) {
    throw new Error('useOllama must be used within OllamaProvider');
  }
  return context;
};

export const OllamaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if Ollama is available (desktop only)
    if (typeof window !== 'undefined' && window.omnibotAPI?.ollama) {
      setIsAvailable(true);
      loadModels();
    }
  }, []);
  
  const loadModels = async () => {
    if (window.omnibotAPI?.ollama) {
      const modelList = await window.omnibotAPI.ollama.listModels();
      setModels(modelList);
      if (modelList.length > 0 && !currentModel) {
        setCurrentModel(modelList[0]);
      }
    }
  };
  
  const chat = async (messages: any[]) => {
    if (!window.omnibotAPI?.ollama || !currentModel) {
      throw new Error('Ollama not available or no model selected');
    }
    return await window.omnibotAPI.ollama.chat(currentModel, messages);
  };
  
  return (
    <OllamaContext.Provider value={{ isAvailable, models, currentModel, setModel: setCurrentModel, chat }}>
      {children}
    </OllamaContext.Provider>
  );
};
```

### Hardware Acceleration Details

Ollama automatically detects and uses available hardware:

**NVIDIA GPUs (CUDA):**
- Automatically uses CUDA if NVIDIA drivers are installed
- Supports compute capability 6.0+ (Pascal and newer)
- Much faster than CPU inference

**Apple Silicon (Metal):**
- Native Metal acceleration on M1/M2/M3 Macs
- Unified memory allows larger models
- Excellent performance

**AMD GPUs (ROCm):**
- Supported on Linux with ROCm drivers
- Good performance on compatible AMD GPUs

**Vulkan (Fallback):**
- Cross-platform GPU acceleration
- Works on most modern GPUs
- Slower than native backends but faster than CPU

**CPU Only:**
- Fallback when no GPU is available
- Uses optimized CPU instructions (AVX, AVX2, AVX512)

---

## 3. llama.cpp Integration (Advanced)

### Why llama.cpp?

**Advantages:**
- ✅ **Maximum control** - Direct access to inference engine
- ✅ **No external dependencies** - Bundled with app
- ✅ **Smallest footprint** - No server process needed
- ✅ **Custom optimizations** - Fine-tune for specific use cases

**Disadvantages:**
- ❌ More complex to integrate
- ❌ Need to manage model files manually
- ❌ Native module compilation required
- ❌ Harder to update/maintain

### Implementation (Using node-llama-cpp)

```typescript
// desktop/main/llama-manager.ts
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import * as path from 'path';

export class LlamaManager {
  private llama: any = null;
  private model: any = null;
  private context: any = null;
  private session: LlamaChatSession | null = null;
  
  async initialize(modelPath: string) {
    this.llama = await getLlama();
    this.model = await this.llama.loadModel({ modelPath });
    this.context = await this.model.createContext();
    this.session = new LlamaChatSession({
      contextSequence: this.context.getSequence()
    });
  }
  
  async chat(prompt: string): Promise<string> {
    if (!this.session) {
      throw new Error('Llama not initialized');
    }
    return await this.session.prompt(prompt);
  }
  
  dispose() {
    this.context?.dispose();
    this.model?.dispose();
  }
}
```

### Hardware Acceleration (node-llama-cpp)

- **Metal** (macOS): Automatically enabled on Apple Silicon
- **CUDA** (NVIDIA): Requires CUDA-enabled prebuilt binary or build from source
- **Vulkan**: Supported via build flags
- **CPU**: Optimized with SIMD instructions

---

## Recommended Implementation Order

### Phase 1: WebLLM (Already Complete)
- ✅ Keep current implementation
- ✅ Works immediately in desktop client
- ✅ No additional work needed

### Phase 2: Ollama Integration (Recommended Next)
1. Add Ollama manager service in main process
2. Create IPC bridge for Ollama operations
3. Add UI to select between WebLLM and Ollama
4. Implement model download UI
5. Test hardware acceleration on different platforms

### Phase 3: Unified Provider (UI Layer)
Create a unified LLM provider that abstracts backend selection:

```typescript
// src/providers/llm-provider.tsx
export type LLMBackend = 'webllm' | 'ollama' | 'llamacpp';

export const LLMProvider = ({ children }) => {
  const [backend, setBackend] = useState<LLMBackend>('webllm');
  
  // Auto-detect best backend
  useEffect(() => {
    if (window.omnibotAPI?.ollama) {
      setBackend('ollama'); // Prefer Ollama on desktop
    }
  }, []);
  
  const chat = async (messages) => {
    switch (backend) {
      case 'webllm':
        return await webllmChat(messages);
      case 'ollama':
        return await ollamaChat(messages);
      case 'llamacpp':
        return await llamacppChat(messages);
    }
  };
  
  return (
    <LLMContext.Provider value={{ backend, setBackend, chat }}>
      {children}
    </LLMContext.Provider>
  );
};
```

### Phase 4: Advanced Features
- Model file management UI
- GPU/CPU utilization monitoring
- Performance benchmarks
- Quantization options
- Context size configuration

---

## Hardware Acceleration Comparison

| Feature | WebLLM | Ollama | llama.cpp |
|---------|--------|--------|-----------|
| **WebGPU** | ✅ Primary | ❌ | ❌ |
| **CUDA** | ❌ | ✅ Auto | ✅ Manual |
| **Metal** | ❌ | ✅ Auto | ✅ Manual |
| **ROCm** | ❌ | ✅ Auto | ✅ Manual |
| **Vulkan** | ✅ Via WebGPU | ✅ Fallback | ✅ Manual |
| **CPU** | ❌ | ✅ Optimized | ✅ Optimized |
| **Setup** | Zero config | Install binary | Build from source |

---

## Privacy & Storage

### WebLLM
- Models: IndexedDB (browser cache)
- Chat history: LocalStorage / IndexedDB
- 100% local, no network after download

### Ollama
- Models: `~/.ollama/models` (user directory)
- Chat history: Managed by app (same as WebLLM)
- Local server, no external calls

### llama.cpp
- Models: User-specified directory
- Chat history: Managed by app
- Fully local

**All backends maintain privacy** - no data leaves the device.

---

## Performance Recommendations

### For Most Users: **Ollama**
- Easy setup (download + install)
- Best performance out-of-the-box
- Automatic hardware acceleration
- Recommended for desktop release

### For Web Parity: **WebLLM**
- Same experience as web version
- No installation needed
- Limited by WebGPU capabilities

### For Power Users: **llama.cpp**
- Maximum control and optimization
- Smaller binary size
- Requires technical knowledge

---

## Next Steps

1. **Research complete** ✅
2. **Create Ollama manager service** (Phase 2, Step 1)
3. **Add IPC handlers for Ollama** (Phase 2, Step 2)
4. **Build unified LLM provider** (Phase 3)
5. **Add backend selection UI** (Phase 3)
6. **Test hardware acceleration** (Phase 2, Step 5)
7. **Document user setup guide** (Final step)

---

## Resources & Documentation

- **Ollama**: https://ollama.com/
- **Ollama API**: https://github.com/ollama/ollama/blob/main/docs/api.md
- **node-llama-cpp**: https://node-llama-cpp.withcat.ai/
- **llama.cpp**: https://github.com/ggml-org/llama.cpp
- **WebLLM**: https://webllm.mlc.ai/
- **Electron IPC**: https://www.electronjs.org/docs/latest/tutorial/ipc
