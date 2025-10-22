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
import UsernameForm from "@/components/username-form";
import useMemoryStore from "@/hooks/useMemoryStore";
import { MessageWithFiles } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";

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

  // Global provider
  const webLLMHelper = useWebLLM();

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
    prompt: string
  ) => {
    const completion = webLLMHelper.generateCompletion(
      loadedEngine,
      prompt,
      customizedInstructions,
      isCustomizedInstructionsEnabled
    );

    let assistantMessage = "";
    let firstChunk = true;
    for await (const chunk of completion) {
      assistantMessage += chunk;
      if (firstChunk) {
        firstChunk = false;
        setStoredMessages((message) => [
          ...message.slice(0, -1),
          { role: "assistant", content: assistantMessage, isProcessingDocument: false },
        ]);
      } else {
        setStoredMessages((message) => [
          ...message.slice(0, -1),
          { role: "assistant", content: assistantMessage },
        ]);
      }
    }

    setIsLoading(false);
    setLoadingSubmit(false);
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
        if (!errorMessage.includes("CANCELED")) {
          setStoredMessages((message) => [
            ...message.slice(0, -1),
          ]);
        }
        return;
      }
    }

    // After engine is loaded, generate completion
    try {
      setLoadingSubmit(true);

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
          await generateCompletion(loadedEngine, qaPrompt);
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
          await generateCompletion(loadedEngine, currentInput);
        }
      } else {
        await generateCompletion(loadedEngine, currentInput);
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
    if (!engine) {
      console.log("No engine available for regeneration");
      return;
    }

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
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <ChatLayout
          key={chatId}
          messages={storedMessages}
          handleSubmit={onSubmit}
          stop={onStop}
          chatId={chatId}
          loadingSubmit={loadingSubmit}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
          loadingError={loadingError}
          isModelLoading={isModelLoading}
        />

        {/* This only shows first time using the app */}
        <DialogContent className="flex flex-col space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle>Welcome to OmniBot chat!</DialogTitle>
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