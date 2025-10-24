"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import * as webllm from "@mlc-ai/web-llm";
import useChatStore from "@/hooks/useChatStore";
import ChatLayout from "@/components/chat/chat-layout";
import { v4 as uuidv4 } from "uuid";
import { useWebLLM } from "@/providers/web-llm-provider";
import { useOllama } from "@/providers/ollama-provider";
import { useLlamaCpp } from "@/providers/llama-cpp-provider";
import UsernameForm from "@/components/username-form";
import useMemoryStore from "@/hooks/useMemoryStore";
import { MessageWithFiles } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { performWebSearch, formatSearchContextForAI } from "@/lib/search-helper";
import { setToastFunction } from "@/lib/tools";
import { toast } from "sonner";

export default function Home() {
  const [open, setOpen] = useState(false);
  const chatId = useMemoryStore((state) => state.chatId);
  const setChatId = useMemoryStore((state) => state.setChatId);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // zustand store
  const input = useChatStore((state) => state.input);
  const setInput = useChatStore((state) => state.setInput);
  const setIsLoading = useChatStore((state) => state.setIsLoading);
  const isLoading = useChatStore((state) => state.isLoading);
  const isModelLoading = useChatStore((state) => state.isModelLoading);
  const setIsModelLoading = useChatStore((state) => state.setIsModelLoading);
  const loadingError = useChatStore((state) => state.loadingError);
  const setLoadingError = useChatStore((state) => state.setLoadingError);
  const storedMessages = useChatStore((state) => state.messages);
  const setStoredMessages = useChatStore((state) => state.setMessages);
  const modelHasChanged = useChatStore((state) => state.modelHasChanged);
  const engine = useChatStore((state) => state.engine);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const selectedBackend = useChatStore((state) => state.selectedBackend);
  const fileText = useChatStore((state) => state.fileText);
  const files = useChatStore((state) => state.files);
  const setFileText = useChatStore((state) => state.setFileText);
  const setFiles = useChatStore((state) => state.setFiles);
  const resetState = useChatStore((state) => state.resetState);
  const customizedInstructions = useMemoryStore(
    (state) => state.customizedInstructions
  );
  const isCustomizedInstructionsEnabled = useMemoryStore(
    (state) => state.isCustomizedInstructionsEnabled
  );
  const base64Images = useChatStore((state) => state.base64Images);
  const setBase64Images = useChatStore((state) => state.setBase64Images);
  const router = useRouter();
  const searchParams = useSearchParams();

  const webLLMHelper = useWebLLM();
  const ollama = useOllama();
  const llamacpp = useLlamaCpp();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setChatId(id);
      const item = localStorage.getItem(`chat_${id}`);
      if (item) {
        setStoredMessages((message) => [...JSON.parse(item)]);
      }
    } else {
      const newId = uuidv4();
      setChatId(newId);
      router.replace(`/?id=${newId}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (fileText && files) {
      const fileStore = {
        fileName: files[0].name,
        fileType: files[0].type,
        fileText: fileText,
      };

      localStorage.setItem(`chatFile_${chatId}`, JSON.stringify(fileStore));
      window.dispatchEvent(new Event("storage"));
    }
  }, [fileText, storedMessages]);

  useEffect(() => {
    if (!isLoading && chatId && storedMessages.length > 0) {
      // Save messages to local storage
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(storedMessages));
      // Trigger the storage event to update the sidebar component
      window.dispatchEvent(new Event("storage"));
    }
  }, [storedMessages, chatId, isLoading]);

  useEffect(() => {
    if (window !== undefined) {
      if (!localStorage.getItem("chatty_user")) {
        setOpen(true);
      }
    }
  }, []);

  // Initialize toast function for tools module
  useEffect(() => {
    setToastFunction((message: string, type: 'error' | 'warning') => {
      if (type === 'warning') {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing operations when component unmounts
      webLLMHelper.cancelLoading();
      webLLMHelper.cancelGeneration();
    };
  }, [webLLMHelper]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("Connection restored");
      setLoadingError(null);
    };

    const handleOffline = () => {
      console.log("Connection lost");
      setLoadingError("No internet connection. Model loading may fail.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setLoadingError]);

  const generateCompletion = async (
    loadedEngine: webllm.MLCEngineInterface,
    prompt: string,
    useTools: boolean = false
  ) => {
    const completion = useTools 
      ? webLLMHelper.generateCompletionWithTools(
          loadedEngine,
          prompt,
          customizedInstructions,
          isCustomizedInstructionsEnabled,
          true
        )
      : webLLMHelper.generateCompletion(
          loadedEngine,
          prompt,
          customizedInstructions,
          isCustomizedInstructionsEnabled
        );

    let assistantMessage = "";
    let firstChunk = true;
    let pendingUpdate = "";
    let updateTimeout: NodeJS.Timeout | null = null;

    const flushUpdate = () => {
      if (pendingUpdate) {
        assistantMessage += pendingUpdate;
        setStoredMessages((message) => [
          ...message.slice(0, -1),
          { role: "assistant", content: assistantMessage },
        ]);
        pendingUpdate = "";
      }
    };

    for await (const chunk of completion) {
      pendingUpdate += chunk;

      if (firstChunk) {
        firstChunk = false;
        flushUpdate();
        setStoredMessages((message) => [
          ...message.slice(0, -1),
          { role: "assistant", content: assistantMessage, isProcessingDocument: false },
        ]);
      }

      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(flushUpdate, 50);
    }

    flushUpdate();
    if (updateTimeout) clearTimeout(updateTimeout);

    setIsLoading(false);
    setLoadingSubmit(false);
  };

  const generateOllamaCompletion = async (prompt: string) => {
    if (!ollama.currentModel) {
      throw new Error("No Ollama model selected. Please select a model first.");
    }

    const messages = storedMessages.slice(0, -1)
      .filter(msg => msg.content)
      .map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' 
          ? msg.content 
          : Array.isArray(msg.content)
            ? msg.content.map(c => c.type === 'text' ? c.text : '').join(' ')
            : ''
      }));

    messages.push({ role: "user", content: prompt });

    let systemContent = "";
    if (isCustomizedInstructionsEnabled && customizedInstructions) {
      systemContent = customizedInstructions;
    }
    
    // Add web search capability notice if search results are included
    if (prompt.includes("[SYSTEM: You have access to real-time web search results")) {
      const searchNotice = "You have access to real-time internet information through web search results. When search results are provided, use them to give accurate, up-to-date answers.";
      systemContent = systemContent ? `${systemContent}\n\n${searchNotice}` : searchNotice;
    }
    
    if (systemContent) {
      messages.unshift({
        role: "system",
        content: systemContent
      });
    }

    let assistantMessage = "";

    const unsubToken = window.offlineAPI?.ollama?.onChatToken((token: string) => {
      assistantMessage += token;
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        { role: "assistant", content: assistantMessage },
      ]);
    });

    try {
      const response = await ollama.chat(messages);
      
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        { role: "assistant", content: response },
      ]);
    } finally {
      if (unsubToken) unsubToken();
      setIsLoading(false);
      setLoadingSubmit(false);
    }
  };

  const generateLlamaCppCompletion = async (prompt: string) => {
    if (!llamacpp.isModelLoaded) {
      throw new Error("No llama.cpp model loaded. Please load a model first.");
    }

    const messages = storedMessages.slice(0, -1)
      .filter(msg => msg.content)
      .map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' 
          ? msg.content 
          : Array.isArray(msg.content)
            ? msg.content.map(c => c.type === 'text' ? c.text : '').join(' ')
            : ''
      }));

    messages.push({ role: "user", content: prompt });

    let systemContent = "";
    if (isCustomizedInstructionsEnabled && customizedInstructions) {
      systemContent = customizedInstructions;
    }
    
    // Add web search capability notice if search results are included
    if (prompt.includes("[SYSTEM: You have access to real-time web search results")) {
      const searchNotice = "You have access to real-time internet information through web search results. When search results are provided, use them to give accurate, up-to-date answers.";
      systemContent = systemContent ? `${systemContent}\n\n${searchNotice}` : searchNotice;
    }
    
    if (systemContent) {
      messages.unshift({
        role: "system",
        content: systemContent
      });
    }

    let assistantMessage = "";

    const unsubToken = window.offlineAPI?.llamacpp?.onChatToken((token: string) => {
      assistantMessage += token;
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        { role: "assistant", content: assistantMessage },
      ]);
    });

    try {
      const response = await llamacpp.chat(messages);
      
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        { role: "assistant", content: response },
      ]);
    } finally {
      if (unsubToken) unsubToken();
      setIsLoading(false);
      setLoadingSubmit(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Prevent submission if already loading or processing
    if (isLoading || isModelLoading) {
      console.log("Already processing, ignoring submit");
      return;
    }

    let loadedEngine = engine;

    e.preventDefault();
    setIsLoading(true);
    setLoadingError(null);

    // Validate backend availability
    if (selectedBackend === 'webllm' && !webLLMHelper) {
      setIsLoading(false);
      setLoadingError("WebLLM is not initialized. Please refresh the page.");
      return;
    }

    // Store the current input for potential retry
    const currentInput = input;

    let userMessage: MessageWithFiles;

    if (base64Images) {
      // Append the image base64 urls to the message
      userMessage = {
        fileName: files ? files[0].name : undefined,
        role: "user",
        content: [
          { type: 'text', text: currentInput },
          ...base64Images.map((image) => ({
            type: 'image_url' as const,
            image_url: { url: image }
          }))
        ],
      };
    } else {
      userMessage = {
        fileName: files ? files[0].name : undefined,
        role: "user",
        content: currentInput
      };
    }

    setFileText(null);
    setFiles(undefined);
    setBase64Images(null)

    setStoredMessages((message) => [
      ...message,
      userMessage,
      { role: "assistant", content: "" },
    ]);

    setInput("");

    try {
      setLoadingSubmit(true);

      // Manual web search trigger: @web or /web or /search
      const manualCmdMatch = input.match(/^(@web|\/web|\/search)\s+(.+)/i);
      const isManualSearch = !!manualCmdMatch;
      const manualQuery = manualCmdMatch ? manualCmdMatch[2].trim() : '';

      // Check if tools should be enabled (when search is enabled and model supports it)
      const toolsEnabledBase = useChatStore.getState().toolsEnabled && useChatStore.getState().searchEnabled;
      let toolsEnabledForThisRequest = toolsEnabledBase;

      // For older approach: still do upfront search if tools not enabled
      let searchContext = "";
      const hasSearchResults = !toolsEnabledBase && useChatStore.getState().searchEnabled;

      // If user explicitly asked to web-search, do an upfront search and disable tool-calling for this turn
      if (isManualSearch) {
        try {
          // Ensure search is enabled so UI reflects searching state
          const { setSearchEnabled } = useChatStore.getState();
          setSearchEnabled(true);

          const results = await performWebSearch(manualQuery);
          if (results && results.length > 0) {
            searchContext = formatSearchContextForAI(results as any);
          }
          // Since we injected results, avoid double-calling tools for this turn
          toolsEnabledForThisRequest = false;
        } catch (searchError) {
          console.error('Manual search failed, continuing without web context:', searchError);
        }
      }
      
      if (hasSearchResults) {
        try {
          const searchResults = await performWebSearch(currentInput);
          if (searchResults && searchResults.length > 0) {
            searchContext = formatSearchContextForAI(searchResults);
          }
        } catch (searchError) {
          console.error("Search failed, continuing without web context:", searchError);
        }
      }

      const enhancedInput = searchContext 
        ? `[SYSTEM: You have access to real-time web search results. Use the following current information to answer the user's query accurately. This information is fresh from the internet and represents the most up-to-date data available.]\n\n${searchContext}\n\n[USER QUERY]: ${currentInput}\n\n[INSTRUCTION: Answer the user's query using the web search results provided above. These are real, current search results that give you access to up-to-date information. Cite specific sources with their numbers [1], [2], etc. when referencing information.]`
        : currentInput;

      if (selectedBackend === 'ollama') {
        if (!window.offlineAPI?.ollama || !ollama.isRunning || !ollama.currentModel) {
          throw new Error("Ollama is not running or no model is selected. Please check your Ollama setup.");
        }
        
        await generateOllamaCompletion(enhancedInput);
      } else if (selectedBackend === 'llamacpp') {
        if (!window.offlineAPI?.llamacpp || !llamacpp.isModelLoaded) {
          throw new Error("llama.cpp model not loaded. Please load a model first.");
        }
        
        await generateLlamaCppCompletion(enhancedInput);
      } else {
        if (!loadedEngine) {
          // Load engine with retry support
          setIsModelLoading(true);
          try {
            loadedEngine = await webLLMHelper.initialize(selectedModel);
            setIsModelLoading(false);
          } catch (e) {
            setIsLoading(false);
            setIsModelLoading(false);
            
            const errorMessage = e instanceof Error ? e.message : String(e);
            setLoadingError(errorMessage);

            // Don't show error message in chat if it was canceled
            if (!errorMessage?.includes?.("CANCELED")) {
              setStoredMessages((message) => [
                ...message.slice(0, -1),
              ]);
            }
            return;
          }
        }

        // If file is uploaded and text is extracted, process the documents
        const existingFile = localStorage.getItem(`chatFile_${chatId}`);
        if (existingFile) {
          const { fileText, fileType, fileName } = JSON.parse(existingFile);

          setStoredMessages((message) => [
            ...message.slice(0, -1),
            { role: "assistant", content: "", isProcessingDocument: true },
          ]);

          try {
            const qaPrompt = await webLLMHelper.processDocuments(
              fileText,
              fileType,
              fileName,
              currentInput
            );
            if (!qaPrompt) {
              throw new Error("Failed to process document");
            }
            setStoredMessages((message) => [
              ...message.slice(0, -1),
              { role: "assistant", content: "", isProcessingDocument: false },
            ]);
            await generateCompletion(loadedEngine, qaPrompt, false);
          } catch (docError) {
            console.error("Document processing error:", docError);
            setStoredMessages((message) => [
              ...message.slice(0, -1),
              {
                role: "assistant",
                content: `⚠️ Failed to process document: ${docError instanceof Error ? docError.message : 'Unknown error'}. Answering without document context.`,
              },
              { role: "assistant", content: "" },
            ]);
            await generateCompletion(loadedEngine, enhancedInput, toolsEnabledForThisRequest);
          }
        } else {
          await generateCompletion(loadedEngine, enhancedInput, toolsEnabledForThisRequest);
        }
      }
    } catch (e) {
      setIsLoading(false);
      setLoadingSubmit(false);
      
      const errorMessage = e instanceof Error ? e.message : String(e);
      setLoadingError(errorMessage);
      
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: `❌ Failed to generate response: ${errorMessage}`,
        },
      ]);
    }
  };

  const onStop = () => {
    console.log("Stop requested");
    
    // Cancel model loading if in progress
    if (isModelLoading) {
      webLLMHelper.cancelLoading();
      setIsModelLoading(false);
    }
    
    // Cancel generation if in progress
    if (engine && webLLMHelper.isGenerating()) {
      webLLMHelper.cancelGeneration();
      engine.interruptGenerate();
    }
    
    setIsLoading(false);
    setLoadingSubmit(false);
    
    // Add canceled message if there's an empty assistant message
    if (storedMessages.length > 0 && storedMessages[storedMessages.length - 1].content === "") {
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: "⏹️ Stopped.",
        },
      ]);
    }
  };

  const onRegenerate = async () => {
    // Prevent regeneration if already loading
    if (isLoading || isModelLoading) {
      console.log("Already processing, ignoring regenerate");
      return;
    }

    // Set the input to the last user message
    const lastMsg = storedMessages[storedMessages.length - 2]?.content;

    if (!lastMsg) {
      console.log("No user message to regenerate from");
      return;
    }

    setIsLoading(true);
    setLoadingSubmit(true);
    setLoadingError(null);

    // Set the input to the last user message (for display purposes)
    setInput(lastMsg.toString());

    // Remove the last assistant message and add empty one
    setStoredMessages((message) => [
      ...message.slice(0, -1),
      { role: "assistant", content: "" },
    ]);

    setInput("");

    try {
      // Handle different backends
      if (selectedBackend === 'ollama') {
        await generateOllamaCompletion(lastMsg.toString());
      } else if (selectedBackend === 'llamacpp') {
        await generateLlamaCppCompletion(lastMsg.toString());
      } else {
        // WebLLM backend
        if (!engine) {
          console.log("No WebLLM engine available for regeneration");
          setIsLoading(false);
          setLoadingSubmit(false);
          setLoadingError("No model loaded. Please wait for the model to load.");
          return;
        }

        const existingFile = localStorage.getItem(`chatFile_${chatId}`);
        if (existingFile) {
          const { fileText, fileType, fileName } = JSON.parse(existingFile);

          setStoredMessages((message) => [
            ...message.slice(0, -1),
            { role: "assistant", content: "", isProcessingDocument: true },
          ]);

          try {
            const qaPrompt = await webLLMHelper.processDocuments(
              fileText,
              fileType,
              fileName,
              lastMsg.toString()
            );
            if (!qaPrompt) {
              throw new Error("Failed to process document");
            }

            setStoredMessages((message) => [
              ...message.slice(0, -1),
              { role: "assistant", content: "", isProcessingDocument: false },
            ]);
            await generateCompletion(engine, qaPrompt);
          } catch (docError) {
            console.error("Document processing error during regeneration:", docError);
            setStoredMessages((message) => [
              ...message.slice(0, -1),
              { role: "assistant", content: "" },
            ]);
            await generateCompletion(engine, lastMsg.toString());
          }
        } else {
          await generateCompletion(engine, lastMsg.toString());
        }
      }
    } catch (e) {
      console.error("Regeneration error:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setLoadingError(errorMessage);
      
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: `❌ Failed to regenerate: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingSubmit(false);
    }
  };

  // Retry last failed operation
  const onRetry = async () => {
    if (!loadingError) {
      return;
    }

    // Check if there's a user message to retry
    if (storedMessages.length < 2) {
      return;
    }

    const lastUserMsg = storedMessages[storedMessages.length - 2];
    if (lastUserMsg.role !== "user") {
      return;
    }

    // Clear error and retry
    setLoadingError(null);
    
    // Remove the error message and regenerate
    setStoredMessages((message) => message.slice(0, -1));
    
    await onRegenerate();
  };

  const onOpenChange = (isOpen: boolean) => {
    const username = localStorage.getItem("chatty_user");
    if (username) return setOpen(isOpen);

    localStorage.setItem("chatty_user", "Anonymous");
    window.dispatchEvent(new Event("storage"));
    setOpen(isOpen);
  };

  return (
    <main className="flex flex-col items-center w-full h-full">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <ChatLayout
          key={chatId}
          messages={storedMessages}
          handleSubmitAction={onSubmit}
          stopAction={onStop}
          chatId={chatId}
          loadingSubmit={loadingSubmit}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
          loadingError={loadingError}
          isModelLoading={isModelLoading}
        />

        <DialogContent className="flex flex-col space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle>Welcome to Offeline chat!</DialogTitle>
            <DialogDescription>
              Enter your name to get started. This is just to personalize your
              experience.
            </DialogDescription>
            <UsernameForm setOpen={setOpen} />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}