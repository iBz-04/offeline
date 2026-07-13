// https://github.com/mlc-ai/web-llm/blob/main/examples/get-started-web-worker

import useChatStore from "@/hooks/useChatStore";
import * as webllm from "@mlc-ai/web-llm";
import { Model } from "./models";
import { Document } from "langchain/document";
import { SYSTEM_PROMPT } from "./system-prompt";

// Error types for better error handling
export enum ModelLoadError {
  NO_GPU = "NO_GPU",
  NETWORK_ERROR = "NETWORK_ERROR",
  INITIALIZATION_ERROR = "INITIALIZATION_ERROR",
  CACHE_ERROR = "CACHE_ERROR",
  CANCELED = "CANCELED",
  UNKNOWN = "UNKNOWN",
}

interface ModelLoadState {
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  modelName: string | null;
}

interface SafeModelLimits {
  maxContextWindowSize: number;
  maxTokens: number;
}

export default class WebLLMHelper {
  engine: webllm.MLCEngineInterface | null;
  setStoredMessages = useChatStore((state) => state.setMessages);
  setEngine = useChatStore((state) => state.setEngine);
  appConfig = webllm.prebuiltAppConfig;
  
  // State management for reliable operations
  private loadState: ModelLoadState = {
    isLoading: false,
    isRetrying: false,
    retryCount: 0,
    modelName: null,
  };
  
  private abortController: AbortController | null = null;
  private generationAbortController: AbortController | null = null;
  private lastProgressUpdate = 0;
  private lastProgressValue = -1;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;
  private loadedModelName: string | null = null;
  // Track a temporary downgrade of context window if device limits require it
  private forcedContextWindowSize: number | null = null;

  public constructor(engine: webllm.MLCEngineInterface | null) {
    // Ensure appConfig is properly initialized
    this.appConfig.useIndexedDBCache = true;
    this.engine = engine;
  }

  // Keep helper's engine reference synchronized with global store
  public setEngineInstance(engine: webllm.MLCEngineInterface | null): void {
    this.engine = engine;
  }

  // Check if device is online
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  // Check if GPU is available
  private hasGPU(): boolean {
    return typeof navigator !== 'undefined' && "gpu" in navigator;
  }

  // Try to read WebGPU device limits; returns null if unavailable
  private async getMaxStorageBuffersPerShaderStage(): Promise<number | null> {
    try {
      if (!this.hasGPU()) return null;
      // Some TS environments may not have WebGPU types; cast to any to avoid type errors
      const adapter: any = await (navigator as any).gpu.requestAdapter?.();
      const limit: number | undefined = adapter?.limits?.maxStorageBuffersPerShaderStage;
      return typeof limit === 'number' ? limit : null;
    } catch {
      return null;
    }
  }

  // Conservative caps to improve reliability on larger models and limited GPUs
  private getSafeModelLimits(modelName: string): SafeModelLimits {
    const normalizedName = modelName.toLowerCase();

    if (
      normalizedName.includes("4b") ||
      normalizedName.includes("3.8b") ||
      normalizedName.includes("7b") ||
      normalizedName.includes("8b") ||
      normalizedName.includes("9b")
    ) {
      return {
        maxContextWindowSize: 1024,
        maxTokens: 512,
      };
    }

    if (normalizedName.includes("3b")) {
      return {
        maxContextWindowSize: 2048,
        maxTokens: 1024,
      };
    }

    if (normalizedName.includes("1.5b") || normalizedName.includes("1.7b")) {
      return {
        maxContextWindowSize: 2048,
        maxTokens: 1024,
      };
    }

    return {
      maxContextWindowSize: 4096,
      maxTokens: 2048,
    };
  }

  // Initialize progress callback with cancellation support
  private initProgressCallback = (report: webllm.InitProgressReport) => {
    if (this.abortController?.signal.aborted) {
      return;
    }

    let progress = 0;

    if (typeof report.progress === "number") {
      progress = Math.round(report.progress * 100);
    } else if (report.text) {
      const progressMatch = report.text.match(/(\d+)%/);
      if (progressMatch) {
        progress = parseInt(progressMatch[1], 10);
      }
    }

    const now = Date.now();
    if (
      progress < 100 &&
      progress === this.lastProgressValue &&
      now - this.lastProgressUpdate < 200
    ) {
      return;
    }

    this.lastProgressUpdate = now;
    this.lastProgressValue = progress;

    const { setModelLoadProgress } = useChatStore.getState();
    setModelLoadProgress(progress);

    if (report.text?.includes("Finish loading") || progress >= 100) {
      this.clearModelLoadState();
    }
  };

  private clearModelLoadState() {
    const { setModelLoadProgress, setModelLoadStatus } = useChatStore.getState();
    setModelLoadProgress(null);
    setModelLoadStatus(null);
    this.lastProgressValue = -1;
    this.lastProgressUpdate = 0;
  }

  // Cancel current loading operation
  public cancelLoading(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.loadState.isLoading = false;
      this.loadState.isRetrying = false;
      this.clearModelLoadState();
    }
  }

  // Internal method to attempt model initialization
  private async attemptInitialize(
    selectedModel: Model,
    retryCount: number = 0
  ): Promise<webllm.MLCEngineInterface> {
    // Create new abort controller for this attempt
    this.abortController = new AbortController();
    
    // Check if already canceled
    if (this.abortController.signal.aborted) {
      throw new Error(ModelLoadError.CANCELED);
    }

  const inferenceSettings = useChatStore.getState().inferenceSettings;
  const safeLimits = this.getSafeModelLimits(selectedModel.name);
    
    // Vision models need larger context window for image embeddings
    const isVisionModel = selectedModel?.name?.toLowerCase()?.includes('vision') ?? false;
    // Use either the user setting, vision default, or a previously forced lower window size
    const baseCws = isVisionModel
      ? 8192
      : Math.min(inferenceSettings.contextWindowSize, safeLimits.maxContextWindowSize);
    const contextWindowSize = this.forcedContextWindowSize
      ? Math.min(baseCws, this.forcedContextWindowSize)
      : baseCws;

    const chatOpts = {
      context_window_size: contextWindowSize,
      initProgressCallback: this.initProgressCallback,
      appConfig: this.appConfig,
    };

    const engine: webllm.MLCEngineInterface = await webllm.CreateWebWorkerMLCEngine(
      new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      }),
      selectedModel.name,
      chatOpts
    );

    // Check if canceled after loading
    if (this.abortController?.signal.aborted) {
      // Clean up the engine if loading was canceled
      await engine.unload();
      throw new Error(ModelLoadError.CANCELED);
    }

    return engine;
  }

  // Initialize the engine with retry logic and cancellation support
  public async initialize(
    selectedModel: Model
  ): Promise<webllm.MLCEngineInterface> {
    // Prevent multiple simultaneous loads
    if (this.loadState.isLoading) {
      throw new Error("Model is already being loaded. Please wait or cancel the current operation.");
    }

    // Reset state
    this.loadState = {
      isLoading: true,
      isRetrying: false,
      retryCount: 0,
      modelName: selectedModel.name,
    };

    // Ensure previous model resources are released before loading a different model
    if (this.engine && this.loadedModelName && this.loadedModelName !== selectedModel.name) {
      try {
        await this.engine.unload();
      } catch (error) {
        console.error("Error unloading previous model:", error);
      } finally {
        this.engine = null;
        this.setEngine(null);
      }
    }

    // Check GPU support
    if (!this.hasGPU()) {
      this.loadState.isLoading = false;
      const error = new Error("This device does not support GPU acceleration.");
      error.name = ModelLoadError.NO_GPU;
      
      this.setStoredMessages((message) => [
        ...message,
        {
          role: "assistant",
          content: "⚠️ This device does not support GPU acceleration. WebLLM requires a GPU to run models.",
        },
      ]);
      
      throw error;
    }

    // Show initial loading state
    const { setModelLoadProgress, setModelLoadStatus } = useChatStore.getState();
    setModelLoadProgress(0);
    setModelLoadStatus(
      this.loadState.isRetrying
        ? `Retry ${this.loadState.retryCount}/${this.MAX_RETRIES}`
        : null
    );

    // Initialize embeddings (non-blocking - in background)
    // Don't wait for embeddings to complete - they can load in parallel
    import("./embed")
      .then(({ getEmbeddingsInstance }) => getEmbeddingsInstance())
      .catch(error => {
        console.warn("Failed to initialize embeddings (non-critical):", error);
      });

    // Try to load the model with retries
    let lastError: Error | null = null;
    
    // Before trying, check device limits and proactively cap context window for very low limits
    const maxSSBO = await this.getMaxStorageBuffersPerShaderStage();
    if (typeof maxSSBO === 'number' && maxSSBO <= 8) {
      // On devices with strict limits, start with a safer window size
      // Try 2048 first; we may reduce further on specific errors
      this.forcedContextWindowSize = 2048;
      setModelLoadStatus("Optimizing for your device…");
      setModelLoadProgress(0);
    }

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.loadState.retryCount = attempt;
        this.loadState.isRetrying = attempt > 0;
        
        const engine = await this.attemptInitialize(selectedModel, attempt);
        
        // Success! Clean up and return
        this.loadState.isLoading = false;
        this.loadState.isRetrying = false;
        this.abortController = null;
        this.clearModelLoadState();
        this.engine = engine;
        this.loadedModelName = selectedModel.name;
        this.setEngine(engine);
        
        return engine;
        
      } catch (error) {
        lastError = error as Error;

        // Handle specific WebGPU limit errors by reducing context window and retrying immediately
        const msg = (lastError?.message || "").toLowerCase();
        const isSSBOLimit = msg.includes("maxstoragebufferspershaderstage") || msg.includes("max storage buffers per shader stage");
        if (isSSBOLimit) {
          // Reduce context window progressively to fit devices with tight limits
          const current = this.forcedContextWindowSize ?? useChatStore.getState().inferenceSettings.contextWindowSize;
          const next = current > 2048 ? 2048 : current > 1024 ? 1024 : current > 512 ? 512 : 0;
          if (next >= 512 && next < current) {
            this.forcedContextWindowSize = next;
            setModelLoadStatus(`Retrying with smaller context…`);
            setModelLoadProgress(0);
            // Immediate retry without counting towards MAX_RETRIES
            attempt--; // neutralize this attempt since we'll retry with adjusted settings
            continue;
          }
        }
        
        // Check if canceled
        if (this.abortController?.signal.aborted || lastError.message === ModelLoadError.CANCELED) {
          this.loadState.isLoading = false;
          this.loadState.isRetrying = false;
          this.clearModelLoadState();
          throw new Error(ModelLoadError.CANCELED);
        }
        
        // Don't retry on last attempt
        if (attempt === this.MAX_RETRIES) {
          break;
        }
        
        // Show retry message
        const isOffline = !this.isOnline();
        const retryMessage = isOffline
          ? `Offline — retry ${attempt + 1}/${this.MAX_RETRIES}`
          : `Retrying… (${attempt + 1}/${this.MAX_RETRIES})`;

        setModelLoadStatus(retryMessage);
        setModelLoadProgress(0);
        
        // Wait before retrying (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * (attempt + 1)));
      }
    }

    // All retries failed
    this.loadState.isLoading = false;
    this.loadState.isRetrying = false;
    this.abortController = null;
    this.clearModelLoadState();
    
    const errorMessage = this.formatErrorMessage(lastError);
    
    this.setStoredMessages((message) => [
      ...message,
      {
        role: "assistant",
        content: errorMessage,
      },
    ]);
    
    throw lastError || new Error("Failed to initialize model after multiple attempts");
  }

  // Format error messages for better UX
  private formatErrorMessage(error: Error | null): string {
    if (!error) {
      return "❌ Failed to load model. Please try again.";
    }

    const isOffline = !this.isOnline();
    
    if (isOffline) {
      return "❌ Failed to load model: No internet connection detected. Please check your connection and try again. If the model was previously cached, it should work offline.";
    }

    const errorMessage = error.message || '';

    if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
      return "❌ Failed to load model: Network error. Please check your internet connection and try again.";
    }

    if (errorMessage.includes("cache") || errorMessage.includes("IndexedDB")) {
      return "❌ Failed to load model: Cache error. Try clearing your browser cache or using incognito mode.";
    }

    // Special hint for WebGPU storage buffer limit issues
    if (errorMessage.toLowerCase().includes("maxstoragebufferspershaderstage") || errorMessage.toLowerCase().includes("max storage buffers per shader stage")) {
      return "❌ Your GPU's WebGPU limit was exceeded by this model's default settings. Try: 1) Reducing the context window in Inference Settings, or 2) Choosing a smaller model (e.g., Qwen 2.5 0.5B).";
    }

    return `❌ Failed to load model: ${error.message}. Please try a different model or refresh the page.`;
  }

  // Check if a model is currently loading
  public isLoading(): boolean {
    return this.loadState.isLoading;
  }

  // Get current load state
  public getLoadState(): ModelLoadState {
    return { ...this.loadState };
  }

  public async reloadEngine(selectedModel: Model) {
    console.log('reloading')
    
    // Cancel any ongoing operations
    this.cancelLoading();
    this.cancelGeneration();
    
    try {
      await this.engine?.reload(selectedModel.name);
    } catch (error) {
      console.error("Failed to reload model:", error);
      // Reset engine on reload failure
      this.setEngine(null);
      throw error;
    }
  }

  // Safely unload the engine
  public async unload(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch (error) {
        console.error("Error unloading engine:", error);
      }
      this.setEngine(null);
    }

    this.engine = null;
    this.loadedModelName = null;
    
    this.loadState = {
      isLoading: false,
      isRetrying: false,
      retryCount: 0,
      modelName: null,
    };
  }

  // Cancel ongoing generation
  public cancelGeneration(): void {
    if (this.generationAbortController) {
      this.generationAbortController.abort();
      this.generationAbortController = null;
    }
  }

  // Check if generation is in progress
  public isGenerating(): boolean {
    return this.generationAbortController !== null;
  }

  // Generate streaming completion with cancellation support
  public async *generateCompletion(
    engine: webllm.MLCEngineInterface,
    input: string,
    customizedInstructions: string,
    isCustomizedInstructionsEnabled: boolean
  ): AsyncGenerator<string> {
    // Create new abort controller for this generation
    this.generationAbortController = new AbortController();
    
    const storedMessages = useChatStore.getState().messages;
    const inferenceSettings = useChatStore.getState().inferenceSettings;
    const selectedModel = useChatStore.getState().selectedModel;
    const safeLimits = this.getSafeModelLimits(selectedModel.name);
    const safeMaxTokens = Math.min(inferenceSettings.maxTokens, safeLimits.maxTokens);

    // Build system content
    let systemContent = SYSTEM_PROMPT;
    
    if (customizedInstructions && isCustomizedInstructionsEnabled) {
      systemContent += `\n\n# User context #\n${customizedInstructions}`;
    }
    
    try {
      const completion = await engine.chat.completions.create({
        stream: true,
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          ...storedMessages,
          { role: "user", content: input },
        ],
        temperature: inferenceSettings.temperature,
        top_p: inferenceSettings.topP,
        max_tokens: safeMaxTokens
      });
      
      for await (const chunk of completion) {
        // Check if generation was canceled
        if (this.generationAbortController?.signal.aborted) {
          console.log("Generation was canceled");
          break;
        }
        
        const delta = chunk.choices[0].delta.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      throw error;
    } finally {
      // Clean up abort controller
      this.generationAbortController = null;
    }
  }

  // Handle document processing using WebWorker to avoid freezing the UI
  public async processDocuments(
    fileText: Document<Record<string, any>>[] | string,
    fileType: string,
    fileName: string,
    userInput: string
  ): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      let worker: Worker | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Timeout after 30 seconds
      const TIMEOUT_MS = 30000;
      
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (worker) {
          worker.terminate();
          worker = null;
        }
      };

      try {
        worker = new Worker(
          new URL("./vector-store-worker.ts", import.meta.url),
          {
            type: "module",
          }
        );

        // Set timeout
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error("Document processing timed out. The file may be too large."));
        }, TIMEOUT_MS);

        worker.onmessage = (e: MessageEvent) => {
          const results = e.data;
          cleanup();
          
          // Check if worker returned an error
          if (results && results.error) {
            reject(new Error("Failed to process document: " + results.error));
            return;
          }
          
          if (results && Array.isArray(results)) {
            // Process results
            const qaPrompt = `\nText content from a file is provided between the <context> tags. The file name and type is also included in the <context> tag. Answer the user question based on the context provied. Also, always keep old messages in mind when answering questions.
            If the question cannot be answered using the context provided, answer with "I don't know".
            
            ==========
            <context  file=${fileName} fileType="type: ${fileType}">
            ${results.map((result: any) => result.pageContent).join("")}\n
            </context>
            ==========

            User question:
            "${userInput}"

            Answer:
            ""
            `;
            resolve(qaPrompt);
          } else {
            reject(new Error("Invalid results from document processing"));
          }
        };

        worker.onerror = (err) => {
          console.error("Vector search worker error:", err);
          cleanup();
          reject(new Error("Failed to process document: " + (err.message || "Unknown error")));
        };

        worker.postMessage({
          fileText,
          fileType,
          userInput,
        });
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
  }

  // Reset all state (useful for cleanup)
  public reset(): void {
    this.cancelLoading();
    this.cancelGeneration();
    this.loadState = {
      isLoading: false,
      isRetrying: false,
      retryCount: 0,
      modelName: null,
    };
    this.abortController = null;
    this.generationAbortController = null;
  }
}
