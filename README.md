# Omnibot

**Omnibot** is a powerful, privacy-first AI chat application with both browser and desktop support. Run open-source LLMs locally on your hardware with multiple backend options—choose between WebGPU for browser-based inference, Ollama, or llama.cpp for desktop environments. Your data never leaves your machine.

---

## 📋 Table of Contents

- [Features](#features)
- [Supported Backends](#supported-backends)
- [Installation](#installation)
- [Requirements](#requirements)
- [Development](#development)
- [Roadmap](#roadmap)
- [Credits](#credits)

---

## ✨ Features

### Core Capabilities

- **🔒 Complete Privacy:** All AI models run locally on your hardware. No data is sent to external servers. Process everything on your machine.
- **📱 Multi-Platform:** Use via browser (web app) or native desktop application with Electron
- **⚡ Offline-Capable:** Download models once, use them offline indefinitely (WebGPU mode)
- **🎯 Multiple AI Backends:** Choose your preferred inference engine:
  - **WebGPU** - Run models directly in your browser using GPU acceleration
  - **Ollama** - Manage and run models with Ollama backend
  - **llama.cpp** - CPU/GPU optimized inference on desktop

### Chat & Interaction

- **💬 Rich Chat Interface:** Clean, intuitive conversation interface with real-time streaming responses
- **📄 File Embeddings:** Load and ask questions about documents (PDF, MD, DOCX, TXT, CSV, RTF) - fully locally!
- **🎤 Voice Support:** Interact with the AI using voice messages
- **🔄 Regenerate Responses:** Quickly regenerate AI responses without retyping prompts
- **💾 Chat History:** Persistent, organized conversation history across sessions
- **📋 Export Conversations:** Save your chats as JSON or Markdown

### AI Customization

- **🧠 Custom Memory/Instructions:** Add custom system prompts and memory to personalize AI behavior
- **🔍 Web Search Integration:** Optional real-time web search capabilities with Tavily or DuckDuckGo (when enabled)
- **🌙 Light & Dark Mode:** Toggle between themes for comfortable usage
- **✨ Markdown & Code Syntax Highlighting:** Beautifully rendered markdown and syntax-highlighted code blocks
- **🤖 Model Selection:** Easily switch between different open-source models

### Supported Models

- **Llama 2 & 3** - Meta's popular language models
- **Gemma** - Google's efficient models
- **Mistral** - Mistral AI's powerful models
- **And more** - Support for any GGUF-compatible models

---

## 🔧 Supported Backends

| Backend | Platform | Type | Notes |
|---------|----------|------|-------|
| **WebGPU** | Browser | GPU | Native browser acceleration, no installation needed |
| **Ollama** | Desktop (Windows/Mac/Linux) | CPU/GPU | Easy model management, requires Ollama installation |
| **llama.cpp** | Desktop (Windows/Mac/Linux) | CPU/GPU | Direct integration, optimized performance |

---

## 📥 Installation

### Web Application

#### Prerequisites

- Node.js 18+
- npm or pnpm package manager
- Modern browser with WebGPU support (Chrome/Edge/Firefox with flags)

#### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/iBz-04/omnibot
   cd omnibot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Run development server:**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open in browser:**

   Navigate to [http://localhost:3000](http://localhost:3000)

#### Production Build

```bash
npm run build
npm run start
```

---

### Desktop Application

#### Prerequisites

- Node.js 18+
- pnpm (recommended)
- For **Ollama backend**: [Ollama](https://ollama.ai) installed and running
- For **llama.cpp backend**: Models in GGUF format

#### Setup

1. **Install desktop dependencies:**

   ```bash
   cd desktop
   pnpm install
   ```

2. **Development Mode:**

   ```bash
   pnpm electron:dev
   ```

3. **Production Build:**

   ```bash
   pnpm electron:prod
   ```

#### Desktop Features

- Native application experience
- Seamless Ollama integration (auto-start/stop)
- Direct llama.cpp support
- System tray integration
- Model management UI

---

### Docker

> **⚠️ Note:** Dockerfile not yet optimized for production. See [Next.js Docker example](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile) for reference.

```bash
docker compose up
```

To rebuild after changes:

```bash
docker compose up --build
```

---

## 💾 Requirements

### Browser (WebGPU)

- **GPU:** GPU with WebGPU support
  - 3B models: ~3GB VRAM
  - 7B models: ~6GB VRAM
  - Larger models: Proportionally more VRAM
- **Browser:** Chrome/Edge 113+, Firefox with WebGPU enabled

### Desktop (Ollama/llama.cpp)

- **RAM:** 8GB+ recommended for 7B models
- **CPU:** Multi-core processor recommended
- **GPU:** Optional but recommended for faster inference
  - NVIDIA (CUDA support)
  - Apple Silicon (Metal support)
  - AMD (Vulkan support)

> **Tip:** Smaller models (3B) are more efficient and suitable for file embeddings on resource-constrained systems.

---

## 🛠️ Development

### Project Structure

```
omnibot/
├── src/                    # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities (search, embedding, tools)
│   ├── providers/         # Context providers
│   └── types/             # TypeScript definitions
├── desktop/               # Electron desktop app
│   ├── main/              # Main process
│   └── preload/           # Preload scripts
└── package.json          # Root dependencies
```

### Tech Stack

**Frontend:**

- Next.js 14 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Radix UI - Component library
- Framer Motion - Animations

**Backends:**

- @mlc-ai/web-llm - WebGPU inference
- Ollama - Model server
- node-llama-cpp - Direct llama.cpp binding

**Utilities:**

- LangChain - AI/LLM utilities
- Transformers.js - ONNX model support
- react-markdown - Markdown rendering
- Zustand - State management

### Building

```bash
# Web development
npm run dev

# Desktop development
cd desktop && pnpm electron:dev

# Full build
npm run build
```

---

## 🗺️ Roadmap

### Completed ✅

- [x] Web application with WebGPU support
- [x] Desktop application (Electron)
- [x] Ollama integration
- [x] llama.cpp integration
- [x] File embeddings (PDF, DOCX, TXT, etc.)
- [x] Web search integration (Tavily, DuckDuckGo)
- [x] Chat history & export
- [x] Custom memory/instructions
- [x] Voice message support

### In Progress 🔄

- [ ] Multiple file embeddings in single session
- [ ] Enhanced model management
- [ ] Performance optimizations
- [ ] Additional search backends

### Future 📋

- [ ] Advanced RAG (Retrieval-Augmented Generation)
- [ ] Plugin system
- [ ] Cloud sync (optional, privacy-preserving)
- [ ] API for third-party integrations

---

## 🎨 Browser Support

| Browser | WebGPU Support | Status |
|---------|---|---|
| Chrome/Edge | 113+ | ✅ Full support |
| Firefox | 120+ | ✅ Full support (enable `dom.webgpu.enabled`) |
| Safari | 17+ (macOS) | ✅ Full support |

Check [WebGPU browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility) for detailed information.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

Omnibot is built with:

- [HuggingFace](https://huggingface.co/) - Model hub
- [LangChain](https://www.langchain.com/) - LLM framework
- [Next.js](https://nextjs.org/) - React framework
- [Electron](https://www.electronjs.org/) - Desktop framework
- [Ollama](https://ollama.ai) - Model server
- [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) - llama.cpp Node.js binding
- Open-source LLM community

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

---

**Made with ❤️ for privacy-conscious AI enthusiasts**

