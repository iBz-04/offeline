# llama.cpp Integration Testing Guide

## Installation Complete ✅

The llama.cpp integration has been fully implemented with the following components:

### Created Files:
1. `src/providers/llama-cpp-provider.tsx` - React context provider for llama.cpp
2. Updated `src/app/layout.tsx` - Added LlamaCppProvider to app
3. Updated `src/components/backend-selector.tsx` - Added llama.cpp option with GGUF model management
4. Updated `src/components/chat/chat-topbar.tsx` - Added llama.cpp model selector
5. Updated `src/app/page.tsx` - Added llama.cpp chat routing with streaming support

### Core Implementation:
- ✅ Manager service with full API (desktop/main/llama-cpp-manager.ts)
- ✅ IPC handlers in main process (desktop/main/index.ts)
- ✅ Preload bridge exposure (desktop/preload/index.ts)
- ✅ TypeScript definitions (src/types/electron.d.ts)
- ✅ React provider with hooks
- ✅ UI integration with backend selector
- ✅ Model selector with GGUF file display
- ✅ Chat routing with streaming tokens

## Testing Steps

### 1. Download a Small GGUF Model

Recommended starter model (493 MB):
```bash
cd ~/.omnibot/models
curl -L -O https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf
```

Alternative models (all under 1.5GB):
- **Qwen2.5:0.5b** (493 MB) - Ultra fast, great for testing
- **Qwen2.5:1.5b** (934 MB) - Better quality, still fast
- **Llama-3.2:1b** (1.3 GB) - Facebook's small model
- **Phi-3.5** (2.2 GB) - Highest quality (slightly larger)

### 2. Start the Desktop App

```bash
cd desktop
pnpm electron:dev
```

### 3. Select llama.cpp Backend

1. Click the **Settings** button in the chat topbar
2. In the **Backend Selector** dialog, click **llama.cpp**
3. You should see:
   - Status: "Ready" (green badge)
   - Models directory path: `~/.omnibot/models/`
   - List of available GGUF models

### 4. Load a Model

1. In the GGUF Models section, click **Load** on your downloaded model
2. Wait for the model to load (watch console for progress)
3. The model status should change to "Loaded" (blue badge)
4. The chat topbar should now show the model name

### 5. Test Chat

1. Type a simple message: "Hi, how are you?"
2. Press Enter
3. You should see:
   - Tokens streaming in real-time
   - Message building character by character
   - Full response when complete

### 6. Advanced Features to Test

#### JSON Schema Enforcement:
```typescript
// Example: Get structured data
const schema = {
  type: "object",
  properties: {
    sentiment: { enum: ["positive", "negative", "neutral"] },
    score: { type: "number", minimum: 0, maximum: 10 }
  }
};

// Use llamacpp.chatWithSchema(messages, schema)
```

#### Embeddings:
```typescript
const embedding = await llamacpp.getEmbedding("some text");
console.log(embedding); // Array of numbers
```

## Hardware Acceleration

llama.cpp automatically detects and uses:

- **Metal** (macOS) - Apple Silicon M1/M2/M3
- **CUDA** (NVIDIA) - RTX 20/30/40 series
- **Vulkan** (fallback) - Most modern GPUs
- **CPU** (fallback) - AVX2/AVX512 optimizations

Check console logs on startup to see which backend is active.

## Performance Expectations

### Qwen2.5:0.5b (Q4_K_M)
- Load time: 2-5 seconds
- Tokens/second: 50-150 (CPU), 200-500 (GPU)
- Memory: ~400 MB

### Qwen2.5:1.5b (Q4_K_M)
- Load time: 3-8 seconds
- Tokens/second: 30-100 (CPU), 100-300 (GPU)
- Memory: ~1 GB

## Troubleshooting

### Model Not Found
- Ensure .gguf file is in `~/.omnibot/models/`
- Click **Refresh** button in backend selector
- Check file permissions

### Slow Loading
- First load compiles kernels (normal)
- Subsequent loads are faster
- Large models take longer

### Out of Memory
- Try smaller quantization (Q4_K_M instead of Q8_0)
- Use smaller model (0.5b instead of 1.5b)
- Close other applications

### Poor Quality Responses
- Model too small for task
- Try larger model or different quantization
- Adjust temperature in inference settings

## Comparison with Other Backends

| Feature | WebLLM | Ollama | llama.cpp |
|---------|--------|--------|-----------|
| **Setup** | Zero config | Install server | Load GGUF file |
| **Performance** | WebGPU limited | Excellent | Excellent |
| **Control** | Low | Medium | **Maximum** |
| **JSON Schema** | ❌ | ❌ | **✅** |
| **Function Calling** | ❌ | Limited | **✅** |
| **Embeddings** | ❌ | ✅ | **✅** |
| **Model Format** | WebLLM cache | Ollama registry | GGUF files |

## Next Steps

1. Test with different model sizes
2. Experiment with JSON schema enforcement
3. Try embedding generation
4. Compare performance across backends
5. Test hardware acceleration on your GPU

## Resources

- [node-llama-cpp Documentation](https://node-llama-cpp.withcat.ai/)
- [GGUF Models on Hugging Face](https://huggingface.co/models?library=gguf)
- [llama.cpp GitHub](https://github.com/ggml-org/llama.cpp)
- [Quantization Guide](https://node-llama-cpp.withcat.ai/guide/choosing-a-model#quantization)
