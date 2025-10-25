<div align="center">
   <h2>Offeline</h2>
</div>

<p align="center">
  <img src="https://res.cloudinary.com/diekemzs9/image/upload/v1761405595/cat_logo_c160ai.png" alt="offelineLogo" width="170"/>
</p>

<div align="center">
   <p><b>Offeline is a privacy-first desktop & web app for running  LLMs locally on your hardware using multiple backend options
</b></p>
</div>


---

##  Table of Contents

- [Features](#features)
- [Supported Backends](#supported-backends)
- [Installation](#installation)
- [Requirements](#requirements)
- [Development](#development)
- [Roadmap](#roadmap)
- [Credits](#credits)

---

## Features

### Core Capabilities

- **Complete Privacy:** All AI models run locally on your hardware. No data is sent to external servers. Process everything on your machine.
- **Multi-Platform:** Use via browser (web app) or native desktop application with Electron
- **Offline-Capable:** Download models once, use them offline indefinitely (WebGPU mode)
- **Multiple AI Backends:** Choose your preferred inference engine:
  - **WebGPU** - Run models directly in your browser using GPU acceleration
  - **Ollama** - Manage and run models with Ollama backend
  - **llama.cpp** - CPU/GPU optimized inference on desktop

### Chat & Interaction

- **Rich Chat Interface:** Clean, intuitive conversation interface with real-time streaming responses
- **File Embeddings:** Load and ask questions about documents (PDF, MD, DOCX, TXT, CSV, RTF) - fully locally!
- **Voice Support:** Interact with the AI using voice messages
- **Regenerate Responses:** Quickly regenerate AI responses without retyping prompts
- **Chat History:** Persistent, organized conversation history across sessions
- **Export Conversations:** Save your chats as JSON or Markdown

### AI Customization

- **Custom Memory/Instructions:** Add custom system prompts and memory to personalize AI behavior
- **Web Search Integration:** Optional real-time web search capabilities with Tavily or DuckDuckGo (when enabled)
- **Light & Dark Mode:** Toggle between themes for comfortable usage
- **Markdown & Code Syntax Highlighting:** Beautifully rendered markdown and syntax-highlighted code blocks
- **Model Selection:** Easily switch between different open-source models

### Supported Models

- **Llama 2 & 3** - Meta's popular language models
- **Gemma** - Google's efficient models
- **Mistral** - Mistral AI's powerful models
- **And more** - Support for any GGUF-compatible models

---

## Supported Backends

| Backend | Platform | Type | Notes |
|---------|----------|------|-------|
| **WebGPU** | Browser | GPU | Native browser acceleration, no installation needed |
| **Ollama** | Desktop (Windows/Mac/Linux) | CPU/GPU | Easy model management, requires Ollama installation |
| **llama.cpp** | Desktop (Windows/Mac/Linux) | CPU/GPU | Direct integration, optimized performance |

---

## Installation

### Web Application

#### Prerequisites

- Node.js 18+
- npm or pnpm package manager
- Modern browser with WebGPU support (Chrome/Edge/Firefox with flags)

#### Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/iBz-04/offeline
   cd offeline
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

## Requirements

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

## Development

### Project Structure

```
offeline/
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

## Roadmap

### Completed

- [x] Web application with WebGPU support
- [x] Desktop application (Electron)
- [x] Ollama integration
- [x] llama.cpp integration
- [x] File embeddings (PDF, DOCX, TXT, etc.)
- [x] Web search integration (Tavily, DuckDuckGo)
- [x] Chat history & export
- [x] Custom memory/instructions
- [x] Voice message support

### In Progress

- [ ] Enhanced model management
- [ ] Performance optimizations
- [ ] Additional search backends

### Future

- [ ] Advanced RAG (Retrieval-Augmented Generation)
- [ ] Plugin system
- [ ] Cloud sync (optional, privacy-preserving)
- [ ] API for third-party integrations

---

## Browser Support

| Browser | WebGPU Support | Status |
|---------|---|---|
| Chrome/Edge | 113+ | Full support |
| Firefox | 120+ | Full support (enable `dom.webgpu.enabled`) |
| Safari | 17+ (macOS) | Full support |

Check [WebGPU browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility) for detailed information.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Credits

Offeline is built with:

- [HuggingFace](https://huggingface.co/) - Model hub
- [LangChain](https://www.langchain.com/) - LLM framework
- [Next.js](https://nextjs.org/) - React framework
- [Electron](https://www.electronjs.org/) - Desktop framework
- [Ollama](https://ollama.ai) - Model server
- [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) - llama.cpp Node.js binding
- Open-source LLM community

---

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

---

## Quick Start (Windows)

Below are common commands for Windows PowerShell; pnpm is recommended (pnpm-lock.yaml is included).

```powershell
# 1) Clone and enter the project
git clone https://github.com/iBz-04/offeline; cd offeline

# 2) Install dependencies (root web app)
pnpm install

# 3) Start the web app (Next.js)
pnpm dev

# 4) IN ANOTHER terminal Start the second web instance
pnpm dev -- -p 3001

# 4) In another terminal: run the desktop app 
cd desktop; pnpm install; pnpm build; pnpm electron:dev
```

Notes:

- WebGPU works best on recent Chrome/Edge on Windows 10/11. If disabled, ensure your GPU drivers are up to date and that Chrome/Edge are current (113+).
- Ollama and llama.cpp backends are available in the desktop app. Install [Ollama](https://ollama.ai) if you want to use Ollama models.

## Configuration & Tips

- Web search backends: You can choose between Tavily (requires API key) and DuckDuckGo (no key). In the UI, open Search settings and paste your Tavily key. Alternatively, you can set the environment variable `NEXT_PUBLIC_TAVILY_API_KEY` before starting the web app.
- File embeddings: For best performance on low-spec machines, prefer smaller models (e.g., 3B) for embedding and chat.
- Desktop llama.cpp: The Electron app uses `node-llama-cpp` under the hood. Use GGUF models. GPU acceleration depends on your platform and build.

## Troubleshooting

- WebGPU not available
   - Update Chrome/Edge to the latest version
   - Update graphics drivers
   - Check chrome://gpu to confirm WebGPU status

- Tavily key errors
   - Make sure you’ve saved the key in the Search settings UI
   - Or set `NEXT_PUBLIC_TAVILY_API_KEY` in your environment
   - The app will fall back to DuckDuckGo if Tavily isn’t configured

- Desktop app doesn’t start
   - Run from the `desktop` folder: `pnpm install` then `pnpm electron:dev`
   - Ensure Node.js 18+ is installed
   - On first run, `electron-builder` may install native deps (let it finish)

