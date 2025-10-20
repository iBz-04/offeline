// https://github.com/mlc-ai/web-llm/blob/main/examples/get-started-web-worker

import useChatStore from "@/hooks/useChatStore";
import * as webllm from "@mlc-ai/web-llm";
import { Model } from "./models";
import { Document } from "langchain/document";
import { XenovaTransformersEmbeddings, getEmbeddingsInstance } from "./embed";

export default class WebLLMHelper {
  engine: webllm.MLCEngineInterface | null;
  setStoredMessages = useChatStore((state) => state.setMessages);
  setEngine = useChatStore((state) => state.setEngine);
  appConfig = webllm.prebuiltAppConfig;

  public constructor(engine: webllm.MLCEngineInterface | null) {
    this.appConfig.useIndexedDBCache = true;
    this.engine = engine;
  }

  // Initialize progress callback
  private initProgressCallback = (report: webllm.InitProgressReport) => {
    let progress = 0;
    
    if (typeof report.progress === 'number') {
      progress = Math.round(report.progress * 100);
    } else {
      // Fallback: parse from text if progress field doesn't exist
      const progressMatch = report.text.match(/(\d+)%/);
      if (progressMatch) {
        progress = parseInt(progressMatch[1], 10);
      }
    }
    
    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
      { 
        role: "assistant", 
        content: "Getting ready for you...",
        loadingProgress: progress
      },
    ]);

    
    if (report.text.includes("Finish loading") || progress >= 100) {
      this.setStoredMessages((message) => [
        ...message.slice(0, -1),
        { role: "assistant", content: "" },
      ]);
    }
  };

  // Initialize the engine
  public async initialize(
    selectedModel: Model
  ): Promise<webllm.MLCEngineInterface> {
    if (!("gpu" in navigator)) {
      return Promise.reject("This device does not support GPU acceleration.");
    }

    this.setStoredMessages((message) => [
      ...message.slice(0, -1),
      {
        role: "assistant",
        content: "Getting ready for you...",
        loadingProgress: 0,
      },
    ]);

    await getEmbeddingsInstance();

    const inferenceSettings = useChatStore.getState().inferenceSettings;
    
    // Vision models need larger context window for image embeddings
    const isVisionModel = selectedModel.name.toLowerCase().includes('vision');
    const contextWindowSize = isVisionModel ? 8192 : inferenceSettings.contextWindowSize;

    const chatOpts = {
      context_window_size: contextWindowSize,
      initProgressCallback: this.initProgressCallback,
      appConfig: this.appConfig,
    };

    try {
      const engine: webllm.MLCEngineInterface = await webllm.CreateWebWorkerMLCEngine(
        new Worker(new URL("./worker.ts", import.meta.url), {
          type: "module",
        }),
        selectedModel.name,
        chatOpts
      );
      this.setEngine(engine);
      return engine;
    } catch (error) {
      console.error("Failed to initialize model:", error);
      this.setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: `Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}. Please try a different model or check your internet connection.`,
        },
      ]);
      throw error;
    }
  }

  public async reloadEngine(selectedModel: Model) {
    console.log('reloading')
    this.engine?.reload(selectedModel.name);
  }

  // Generate streaming completion
  public async *generateCompletion(
    engine: webllm.MLCEngineInterface,
    input: string,
    customizedInstructions: string,
    isCustomizedInstructionsEnabled: boolean
  ): AsyncGenerator<string> {
    const storedMessages = useChatStore.getState().messages;
    const inferenceSettings = useChatStore.getState().inferenceSettings;

    const completion = await engine.chat.completions.create({
      stream: true,
      messages: [
        {
          role: "system",
          content:
            customizedInstructions && isCustomizedInstructionsEnabled
              ? "You are a helpful assistant. Assist the user with their questions. You are also provided with the following information from the user, keep them in mind for your responses: " +
              customizedInstructions
              : "You are a helpful assistant. Assist the user with their questions.",
        },
        ...storedMessages,
        { role: "user", content: input },
      ],
      temperature: inferenceSettings.temperature,
      top_p: inferenceSettings.topP,
      max_tokens: inferenceSettings.maxTokens
    });
    for await (const chunk of completion) {
      const delta = chunk.choices[0].delta.content;
      if (delta) {
        yield delta;
      }
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
      const worker = new Worker(
        new URL("./vector-store-worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      worker.onmessage = (e: MessageEvent) => {
        const results = e.data;
        if (results) {
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
          reject("Error processing documents");
        }
      };

      worker.onerror = (err) => {
        console.error("Vector search worker error:", err);
        reject(err);
      };

      worker.postMessage({
        fileText,
        fileType,
        userInput,
      });
    });
  }
}
