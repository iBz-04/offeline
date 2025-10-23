# llama.cpp Integration Plan (Phase 3)

## Overview
Integration of node-llama-cpp bindings for advanced users requiring maximum control and performance.

## Key Benefits
- **Pre-built binaries** - Metal, CUDA, Vulkan support out of the box
- **Auto hardware detection** - Automatically adapts to available GPU
- **No external server** - Direct in-process inference
- **JSON schema enforcement** - Type-safe model responses
- **Function calling** - Models can call defined functions
- **Embedding support** - Text embeddings and reranking
- **Full TypeScript support** - Complete type safety

## Architecture

```
┌─────────────────────────────────────┐
│   Renderer (React UI)               │
│   └─ LlamaCppProvider               │
└─────────────────────────────────────┘
              │ IPC
              ▼
┌─────────────────────────────────────┐
│   Main Process                       │
│   └─ LlamaCppManager                │
│      ├─ Model Loading               │
│      ├─ Context Management          │
│      ├─ Session Handling            │
│      └─ Inference                   │
└─────────────────────────────────────┘
              │ Direct Binding
              ▼
┌─────────────────────────────────────┐
│   node-llama-cpp (Native)           │
│   └─ llama.cpp                      │
│      └─ Hardware Acceleration       │
│         ├─ Metal (macOS)            │
│         ├─ CUDA (NVIDIA)            │
│         ├─ Vulkan (cross-platform)  │
│         └─ CPU (fallback)           │
└─────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd desktop
pnpm add node-llama-cpp
```

### Step 2: Create Manager Service
File: `desktop/main/llama-cpp-manager.ts`

### Step 3: IPC Bridge
Update: `desktop/main/index.ts`

### Step 4: Preload Exposure
Update: `desktop/preload/index.ts`

### Step 5: React Provider
File: `src/providers/llama-cpp-provider.tsx`

### Step 6: UI Integration
Update model selector to show llama.cpp models

### Step 7: Unified Backend Selector
Extend backend selector to include llama.cpp option

## Hardware Acceleration Support

### Automatic Detection
- Metal: Auto-enabled on macOS (M1/M2/M3)
- CUDA: Auto-enabled with NVIDIA drivers
- Vulkan: Cross-platform fallback
- CPU: Optimized with SIMD instructions

### Model Storage
- Location: `~/.omnibot/models/` or user-specified
- Format: GGUF files
- Management: Built-in download and versioning

## API Design

### Chat Interface
```typescript
await llamaCpp.chat({
  model: 'llama-3.2-1b.Q4_K_M.gguf',
  messages: [...],
  onToken: (token) => {...}
})
```

### JSON Schema
```typescript
const schema = {
  type: 'object',
  properties: {...}
};
const response = await session.prompt(query, { schema });
```

### Function Calling
```typescript
const functions = {
  searchWeb: defineFunction({...}),
  calculateMath: defineFunction({...})
};
await session.prompt(query, { functions });
```

## Performance Optimizations
- Context caching
- Automatic batching
- Smart context shifting
- Token prediction (speculative decoding)

## Model Recommendations
Small models under 2GB for desktop use:
- Qwen2.5:0.5b (Q4_K_M) - 397 MB
- Qwen2.5:1.5b (Q4_K_M) - 934 MB
- Llama-3.2:1b (Q4_K_M) - 1.3 GB
- Phi-3.5:3.8b (Q4_K_M) - 2.2 GB

## Next Steps
1. Install node-llama-cpp dependency
2. Implement manager service
3. Create IPC handlers
4. Build React provider
5. Integrate with UI
6. Test hardware acceleration
