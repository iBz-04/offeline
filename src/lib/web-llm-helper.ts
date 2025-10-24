// https://github.com/mlc-ai/web-llm/blob/main/examples/get-started-web-worker

import useChatStore from "@/hooks/useChatStore";
import * as webllm from "@mlc-ai/web-llm";
import { Model } from "./models";
import { Document } from "langchain/document";
import { XenovaTransformersEmbeddings, getEmbeddingsInstance } from "./embed";
import { 
  availableTools, 
  executeToolCall, 
  modelSupportsFunctionCalling,
  ToolCall,
  ToolResult 
} from "./tools";

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
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;
  // Track a temporary downgrade of context window if device limits require it
  private forcedContextWindowSize: number | null = null;

  public constructor(engine: webllm.MLCEngineInterface | null) {
    // Ensure appConfig is properly initialized
    this.appConfig.useIndexedDBCache = true;
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

  // Initialize progress callback with cancellation support
  private initProgressCallback = (report: webllm.InitProgressReport) => {
    // Check if loading was canceled
    if (this.abortController?.signal.aborted) {
      return;
    }

    let progress = 0;
    
    if (typeof report.progress === 'number') {
      progress = Math.round(report.progress * 100);
    } else if (report.text) {
      // Fallback: parse from text if progress field doesn't exist
      const progressMatch = report.text.match(/(\d+)%/);
      if (progressMatch) {
        progress = parseInt(progressMatch[1], 10);
      }
    }
    
    const retryInfo = this.loadState.isRetrying 
      ? ` (Retry ${this.loadState.retryCount}/${this.MAX_RETRIES})` 
      : '';
    
    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
      { 
        role: "assistant", 
        content: `Getting ready for you...${retryInfo}`,
        loadingProgress: progress
      },
    ]);

    if (report.text?.includes("Finish loading") || progress >= 100) {
      this.setStoredMessages((message) => [
        ...message.slice(0, -1),
        { role: "assistant", content: "" },
      ]);
    }
  };

  // Cancel current loading operation
  public cancelLoading(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.loadState.isLoading = false;
      this.loadState.isRetrying = false;
      
      this.setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: "Model loading canceled.",
        },
      ]);
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
    
    // Vision models need larger context window for image embeddings
    const isVisionModel = selectedModel?.name?.toLowerCase()?.includes('vision') ?? false;
    // Use either the user setting, vision default, or a previously forced lower window size
    const baseCws = isVisionModel ? 8192 : inferenceSettings.contextWindowSize;
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

    // Check GPU support
    if (!this.hasGPU()) {
      this.loadState.isLoading = false;
      const error = new Error("This device does not support GPU acceleration.");
      error.name = ModelLoadError.NO_GPU;
      
      this.setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: "⚠️ This device does not support GPU acceleration. WebLLM requires a GPU to run models.",
        },
      ]);
      
      throw error;
    }

    // Show initial loading message
    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
      {
        role: "assistant",
        content: "Getting ready for you...",
        loadingProgress: 0,
      },
    ]);

    // Initialize embeddings (non-blocking - in background)
    // Don't wait for embeddings to complete - they can load in parallel
    getEmbeddingsInstance().catch(error => {
      console.warn("Failed to initialize embeddings (non-critical):", error);
      // Embeddings failure is non-critical - main LLM can still work
    });

    // Try to load the model with retries
    let lastError: Error | null = null;
    
    // Before trying, check device limits and proactively cap context window for very low limits
    const maxSSBO = await this.getMaxStorageBuffersPerShaderStage();
    if (typeof maxSSBO === 'number' && maxSSBO <= 8) {
      // On devices with strict limits, start with a safer window size
      // Try 2048 first; we may reduce further on specific errors
      this.forcedContextWindowSize = 2048;
      this.setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: "Detected a GPU with strict WebGPU limits. Optimizing settings for compatibility (reduced context window).",
          loadingProgress: 0,
        },
      ]);
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
            this.setStoredMessages((message) => [
              ...message.slice(0, -1),
              {
                role: "assistant",
                content: `Your GPU driver has a storage buffer limit. Retrying with a smaller context window (${next}).`,
                loadingProgress: 0,
              },
            ]);
            // Immediate retry without counting towards MAX_RETRIES
            attempt--; // neutralize this attempt since we'll retry with adjusted settings
            continue;
          }
        }
        
        // Check if canceled
        if (this.abortController?.signal.aborted || lastError.message === ModelLoadError.CANCELED) {
          this.loadState.isLoading = false;
          this.loadState.isRetrying = false;
          throw new Error(ModelLoadError.CANCELED);
        }
        
        // Don't retry on last attempt
        if (attempt === this.MAX_RETRIES) {
          break;
        }
        
        // Show retry message
        const isOffline = !this.isOnline();
        const retryMessage = isOffline
          ? `⚠️ You appear to be offline. Retrying in ${this.RETRY_DELAY_MS / 1000}s... (${attempt + 1}/${this.MAX_RETRIES})`
          : `⚠️ Loading failed. Retrying in ${this.RETRY_DELAY_MS / 1000}s... (${attempt + 1}/${this.MAX_RETRIES})`;
        
        this.setStoredMessages((message) => [
          ...message.slice(0, -1),
          {
            role: "assistant",
            content: retryMessage,
            loadingProgress: 0,
          },
        ]);
        
        // Wait before retrying (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * (attempt + 1)));
      }
    }

    // All retries failed
    this.loadState.isLoading = false;
    this.loadState.isRetrying = false;
    this.abortController = null;
    
    const errorMessage = this.formatErrorMessage(lastError);
    
    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
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
      return "❌ Your GPU's WebGPU limit was exceeded by this model's default settings. Try: 1) Reducing the context window in Inference Settings, 2) Choosing a smaller model (e.g., Omni Nano), or 3) Switching backend to Ollama/llama.cpp on desktop.";
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

    // Build system content
    let systemContent = "You are a helpful assistant. Assist the user with their questions.";
    
    if (customizedInstructions && isCustomizedInstructionsEnabled) {
      systemContent += " You are also provided with the following information from the user, keep them in mind for your responses: " + customizedInstructions;
    }
    
    // Add web search capability notice if search results are included in the input
    if (input.includes("[SYSTEM: You have access to real-time web search results")) {
      systemContent += "\n\nIMPORTANT: You have access to real-time internet information through web search results. When search results are provided in the user's message, use them to give accurate, up-to-date answers. These are current, fresh results from the internet.";
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
        max_tokens: inferenceSettings.maxTokens
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

  // Generate completion with tool/function calling support
  public async *generateCompletionWithTools(
    engine: webllm.MLCEngineInterface,
    input: string,
    customizedInstructions: string,
    isCustomizedInstructionsEnabled: boolean,
    enableTools: boolean = false
  ): AsyncGenerator<string> {
    // Create new abort controller for this generation
    this.generationAbortController = new AbortController();
    
    const storedMessages = useChatStore.getState().messages;
    const inferenceSettings = useChatStore.getState().inferenceSettings;
    const selectedModel = useChatStore.getState().selectedModel;

    // Build system content
    let systemContent = "You are a helpful assistant. Assist the user with their questions.";
    
    if (customizedInstructions && isCustomizedInstructionsEnabled) {
      systemContent += " You are also provided with the following information from the user, keep them in mind for your responses: " + customizedInstructions;
    }

    // Add tool capability notice
    if (enableTools && modelSupportsFunctionCalling(selectedModel.name)) {
      systemContent += "\n\nYou have access to tools/functions. When you need current information or real-time data, use the appropriate tool. Always call tools when needed rather than saying you don't have access.";
    }

    const messages: any[] = [
      { role: "system", content: systemContent },
      ...storedMessages,
      { role: "user", content: input },
    ];

    try {
      const supportsTools = enableTools && modelSupportsFunctionCalling(selectedModel.name);
      const maxIterations = 5; // Prevent infinite loops
      let iteration = 0;

      while (iteration < maxIterations) {
        iteration++;

        const completionParams: any = {
          stream: true,
          messages,
          temperature: inferenceSettings.temperature,
          top_p: inferenceSettings.topP,
          max_tokens: inferenceSettings.maxTokens,
        };

        // Add tools if supported
        if (supportsTools) {
          completionParams.tools = availableTools;
          completionParams.tool_choice = 'auto';
        }

        let completion: any;
        let fullResponse = '';
        let toolCalls: ToolCall[] = [];
        let hasToolCalls = false;

        // Try streaming first, fallback to non-streaming if tools cause issues
        try {
          completion = await engine.chat.completions.create(completionParams);
          
          // Check if result is iterable (streaming) or direct response
          if (Symbol.asyncIterator in Object(completion)) {
            // Streaming response
            for await (const chunk of completion) {
              // Check if generation was canceled
              if (this.generationAbortController?.signal.aborted) {
                console.log("Generation was canceled");
                return;
              }
              
              const delta = chunk.choices[0].delta;
              
              // Handle content
              if (delta.content) {
                fullResponse += delta.content;
                yield delta.content;
              }

              // Handle tool calls
              if (delta.tool_calls) {
                hasToolCalls = true;
                for (const toolCall of delta.tool_calls) {
                  const index = toolCall.index || 0;
                  if (!toolCalls[index]) {
                    toolCalls[index] = {
                      id: toolCall.id || `call_${Date.now()}_${index}`,
                      type: 'function',
                      function: { name: '', arguments: '' }
                    };
                  }
                  if (toolCall.function?.name) {
                    toolCalls[index].function.name = toolCall.function.name;
                  }
                  if (toolCall.function?.arguments) {
                    toolCalls[index].function.arguments += toolCall.function.arguments;
                  }
                }
              }
            }
          } else {
            // Non-streaming response
            const choice = completion.choices[0];
            if (choice.message.content) {
              fullResponse = choice.message.content;
              yield fullResponse;
            }
            if (choice.message.tool_calls) {
              hasToolCalls = true;
              toolCalls = choice.message.tool_calls;
            }
          }
        } catch (streamError) {
          console.warn("Streaming with tools failed, trying non-streaming:", streamError);
          // Fallback to non-streaming
          completionParams.stream = false;
          completion = await engine.chat.completions.create(completionParams);
          const choice = completion.choices[0];
          if (choice.message.content) {
            fullResponse = choice.message.content;
            yield fullResponse;
          }
          if (choice.message.tool_calls) {
            hasToolCalls = true;
            toolCalls = choice.message.tool_calls;
          }
        }

        // If no tool calls, we're done
        if (!hasToolCalls || toolCalls.length === 0) {
          break;
        }

        // Execute tool calls
        yield '\n\n🔍 *Using tools to get current information...*\n\n';
        
        // Add assistant message with tool calls to history
        messages.push({
          role: 'assistant',
          content: fullResponse || null,
          tool_calls: toolCalls
        });

        // Execute each tool call and add results
        const toolResults: ToolResult[] = [];
        for (const toolCall of toolCalls) {
          try {
            const result = await executeToolCall(toolCall);
            toolResults.push(result);
            
            // Show which tool was called
            yield `*Called ${toolCall.function.name}*\n`;
          } catch (error) {
            console.error('Tool execution error:', error);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              name: toolCall.function.name,
              content: JSON.stringify({ error: 'Tool execution failed' })
            });
          }
        }

        // Add tool results to messages
        for (const result of toolResults) {
          messages.push(result);
        }

        yield '\n\n';

        // Continue the conversation with tool results
        // The next iteration will generate a response using the tool results
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
