import type { getLlama as _getLlamaType, Llama, LlamaModel, LlamaContext, LlamaChatSession, ChatHistoryItem } from 'node-llama-cpp';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

interface ModelInfo {
  name: string;
  path: string;
  size: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LlamaCppManager extends EventEmitter {
  private llama: Llama | null = null;
  private llamaModule: any = null;
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private session: LlamaChatSession | null = null;
  private modelsDir: string;
  private currentModelPath: string | null = null;
  private overrides: {
    gpu?: 'auto' | 'cuda' | 'vulkan' | 'metal' | false;
    build?: 'auto' | 'never' | 'try' | 'forceRebuild';
    debug?: boolean;
    maxThreads?: number;
  } = {};

  constructor() {
    super();
    this.modelsDir = path.join(os.homedir(), '.omnibot', 'models');
    this.ensureModelsDir();
  }

  private ensureModelsDir(): void {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (!this.llama) {
      const dynamicImport: (s: string) => Promise<any> = new Function(
        's',
        'return import(s)'
      ) as any;
      const mod = await dynamicImport('node-llama-cpp');
      this.llamaModule = mod;

      // CPU by default
      const envGpu = (process.env.LLAMA_GPU || '').trim().toLowerCase();
      const envBuild = (process.env.LLAMA_BUILD || '').trim().toLowerCase();
      const envDebug = (process.env.LLAMA_DEBUG || '').trim().toLowerCase();
      const envMaxThreads = (process.env.LLAMA_MAX_THREADS || '').trim();

      function parseBooleanishFalse(v: string): boolean {
        return v === 'false' || v === 'off' || v === 'none' || v === 'disable' || v === 'disabled';
      }

  type GpuOpt = 'auto' | 'cuda' | 'vulkan' | 'metal' | false;
  let gpuOption: GpuOpt = this.overrides.gpu ?? (envGpu ? undefined as any : false);
  if (gpuOption === undefined) gpuOption = 'auto';

      if (this.overrides.gpu !== undefined) {
        gpuOption = this.overrides.gpu;
      } else if (envGpu) {
        if (parseBooleanishFalse(envGpu)) {
          gpuOption = false;
        } else if (envGpu === 'auto') {
          gpuOption = 'auto';
        } else if (envGpu === 'cuda' || envGpu === 'vulkan' || envGpu === 'metal') {
          gpuOption = envGpu as GpuOpt;
        } else {
          gpuOption = 'auto';
        }
      }

      if (gpuOption === 'auto') {
        try {
          const supported: Array<'cuda' | 'vulkan' | 'metal'> = await mod.getLlamaGpuTypes('supported');
          if (process.platform === 'win32') {
            if (supported.includes('cuda')) gpuOption = 'cuda';
            else if (supported.includes('vulkan')) gpuOption = 'vulkan';
            else gpuOption = false;
          } else if (process.platform === 'darwin') {
            if (supported.includes('metal')) gpuOption = 'metal';
            else gpuOption = false;
          } else {
            if (supported.includes('cuda')) gpuOption = 'cuda';
            else if (supported.includes('vulkan')) gpuOption = 'vulkan';
            else gpuOption = false;
          }
        } catch {
          gpuOption = false;
        }
      }

      let buildOption: 'auto' | 'never' | 'try' | 'forceRebuild' | undefined = this.overrides.build;
      if (!buildOption) {
        if (envBuild === 'auto' || envBuild === 'never' || envBuild === 'try' || envBuild === 'forcerebuild') {
          buildOption = envBuild as any;
        }
      }

      const debugOption = this.overrides.debug ?? (envDebug === '1' || envDebug === 'true' || envDebug === 'yes');
      const maxThreadsOption = this.overrides.maxThreads ?? (envMaxThreads ? Math.max(0, Number.parseInt(envMaxThreads, 10) || 0) : undefined);

      const getLlama = mod.getLlama as (opts?: {
        gpu?: GpuOpt | { type: 'auto'; exclude?: Array<'cuda' | 'vulkan' | 'metal' | false> };
        build?: 'auto' | 'never' | 'try' | 'forceRebuild';
        debug?: boolean;
        maxThreads?: number;
      }) => Promise<Llama>;

      this.llama = await getLlama({
        gpu: gpuOption,
        build: buildOption,
        debug: debugOption,
        maxThreads: maxThreadsOption,
      });
      this.emit('ready');
    }
  }

  async setOptions(opts: {
    gpu?: 'auto' | 'cuda' | 'vulkan' | 'metal' | false;
    build?: 'auto' | 'never' | 'try' | 'forceRebuild';
    debug?: boolean;
    maxThreads?: number;
    reinitialize?: boolean;
  }): Promise<void> {
    this.overrides = { ...this.overrides, ...opts };
    if (opts.reinitialize) {
      // Dispose existing instance and reinitialize to apply changes
      if (this.session || this.context || this.model || this.llama) {
        await this.dispose();
      }
      await this.initialize();
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];
    
    if (!fs.existsSync(this.modelsDir)) {
      return models;
    }

    const files = fs.readdirSync(this.modelsDir);
    
    for (const file of files) {
      if (file.endsWith('.gguf')) {
        const filePath = path.join(this.modelsDir, file);
        const stats = fs.statSync(filePath);
        models.push({
          name: file,
          path: filePath,
          size: stats.size
        });
      }
    }

    return models;
  }

  async loadModel(modelPath: string): Promise<void> {
    if (!this.llama) {
      await this.initialize();
    }

    if (this.currentModelPath === modelPath && this.model) {
      return;
    }

    await this.unloadModel();

    this.model = await this.llama!.loadModel({ modelPath });
    this.context = await this.model.createContext();
    const LlamaChatSessionCtor = this.llamaModule?.LlamaChatSession ?? this.llamaModule?.LlamaChatSession;
    if (!LlamaChatSessionCtor) throw new Error('LlamaChatSession constructor not found in node-llama-cpp module');
    this.session = new LlamaChatSessionCtor({
      contextSequence: this.context.getSequence()
    });

    this.currentModelPath = modelPath;
    this.emit('modelLoaded', modelPath);
  }

  async unloadModel(): Promise<void> {
    if (this.context) {
      this.context.dispose();
      this.context = null;
    }
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.session = null;
    this.currentModelPath = null;
  }

  async chat(messages: ChatMessage[], onToken?: (token: string) => void): Promise<string> {
    if (!this.session || !this.model) {
      throw new Error('No model loaded');
    }

    const messagesCopy = [...messages];
    const lastMessage = messagesCopy.pop();
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    const history: ChatHistoryItem[] = messagesCopy
      .filter(m => m.role !== 'assistant')
      .map(m => {
        if (m.role === 'system') {
          return { type: 'system' as const, text: m.content };
        } else {
          return { type: 'user' as const, text: m.content };
        }
      });

    this.session.setChatHistory(history);

    let fullResponse = '';
    await this.session.prompt(lastMessage.content, {
      onToken: (chunk) => {
        const token = this.model!.detokenize(chunk);
        fullResponse += token;
        if (onToken) {
          onToken(token);
        }
      }
    });

    return fullResponse;
  }

  async chatWithSchema(
    messages: ChatMessage[],
    schema: any,
    onToken?: (token: string) => void
  ): Promise<any> {
    if (!this.session || !this.llama || !this.model) {
      throw new Error('No model loaded');
    }

    const grammar = await this.llama.createGrammarForJsonSchema(schema);
    const messagesCopy = [...messages];
    const lastMessage = messagesCopy.pop();
    if (!lastMessage || lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    const history: ChatHistoryItem[] = messagesCopy
      .filter(m => m.role !== 'assistant')
      .map(m => {
        if (m.role === 'system') {
          return { type: 'system' as const, text: m.content };
        } else {
          return { type: 'user' as const, text: m.content };
        }
      });

    this.session.setChatHistory(history);

    let fullResponse = '';
    await this.session.prompt(lastMessage.content, { 
      grammar,
      onToken: (chunk) => {
        const token = this.model!.detokenize(chunk);
        fullResponse += token;
        if (onToken) {
          onToken(token);
        }
      }
    });

    return grammar.parse(fullResponse);
  }

  async getEmbedding(text: string): Promise<readonly number[]> {
    if (!this.model) {
      throw new Error('No model loaded');
    }

    const embeddingContext = await this.model.createEmbeddingContext();
    const embedding = await embeddingContext.getEmbeddingFor(text);
    embeddingContext.dispose();

    return embedding.vector;
  }

  getModelsDirectory(): string {
    return this.modelsDir;
  }

  getCurrentModel(): string | null {
    return this.currentModelPath;
  }

  isModelLoaded(): boolean {
    return this.model !== null && this.session !== null;
  }

  async dispose(): Promise<void> {
    await this.unloadModel();
    this.llama = null;
    this.emit('disposed');
  }
}
