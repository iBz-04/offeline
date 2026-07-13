"use client";

import React, { useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import TextareaAutosize from "react-textarea-autosize";
import { AnimatePresence } from "framer-motion";
import { Cross2Icon, StopIcon, Mic, ArrowUp } from "@econic";
import { ChatProps } from "@/lib/types";
import useChatStore from "@/hooks/useChatStore";
import FileLoader from "../file-loader";
import useSpeechToText from "@/hooks/useSpeechRecognition";
import { isCoarsePointer } from "@/lib/utils";
import MultiImagePicker from "../image-embedder";
interface MergedProps extends ChatProps {
  files: File[] | undefined;
  setFiles: (files: File[] | undefined) => void;
}

export default function ChatBottombar({
  handleSubmitAction,
  stopAction,
  files,
  setFiles,
  loadingError,
  isModelLoading,
}: MergedProps) {
  const input = useChatStore((state) => state.input);
  const handleInputChange = useChatStore((state) => state.handleInputChange);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = React.useState(false);

  const isLoading = useChatStore((state) => state.isLoading);
  const fileText = useChatStore((state) => state.fileText);
  const setFileText = useChatStore((state) => state.setFileText);
  const setInput = useChatStore((state) => state.setInput);
  const base64Images = useChatStore((state) => state.base64Images);
  const setBase64Images = useChatStore((state) => state.setBase64Images);
  const selectedModel = useChatStore((state) => state.selectedModel);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (isLoading) return;

      e.preventDefault();
      handleSubmitAction(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({ continuous: true });

  const listen = () => {
    isListening ? stopVoiceInput() : startListening();
  };

  const stopVoiceInput = () => {
    setInput(transcript.length ? transcript : "");
    stopListening();
  };

  const handleListenClick = () => {
    listen();
  };

  useEffect(() => {
    if (inputRef.current && !isCoarsePointer()) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      stopVoiceInput();
    }
  }, [isLoading]);

  return (
    <div
      className={`flex w-full flex-col gap-1 px-3 pb-safe transition-opacity ${isModelLoading ? "pointer-events-none opacity-50" : ""}`}
    >
      <AnimatePresence initial={false}>
        <div className="relative w-full items-center">
          <div className="relative flex w-full flex-col rounded-full bg-card">
            <div className="flex w-full">
              <form
                onSubmit={handleSubmitAction}
                className="relative flex w-full items-center gap-2"
              >
                <div className="absolute flex left-4 z-10">
                  {/*
                  <MultiImagePicker 
                    disabled={!selectedModel?.name?.includes("vision")} 
                    onImagesPick={setBase64Images} 
                  />
                  */}
                  <FileLoader
                    setFileText={setFileText}
                    files={files}
                    setFiles={setFiles}
                  />
                </div>
                <TextareaAutosize
                  autoComplete="off"
                  enterKeyHint="send"
                  inputMode="text"
                  value={
                    isListening ? (transcript.length ? transcript : "") : input
                  }
                  ref={inputRef}
                  onKeyDown={handleKeyPress}
                  onChange={handleInputChange}
                  name="message"
                  placeholder={
                    !isListening ? "What's on your mind?" : "Listening"
                  }
                  rows={1}
                  className="flex min-h-[3.25rem] max-h-24 w-full resize-none items-center rounded-full bg-transparent pl-[3.75rem] pr-[5.5rem] py-[0.875rem] font-body text-base md:text-sm leading-6 placeholder:text-lg placeholder:md:text-xl placeholder:text-muted-foreground/45 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />

                {!isLoading ? (
                  <div className="flex absolute right-4 items-center gap-1">
                    {isListening ? (
                      <div className="flex">
                        <Button
                          className="shrink-0 relative rounded-full bg-secondary hover:bg-secondary"
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={handleListenClick}
                          disabled={isLoading}
                        >
                          <Mic className="w-5 h-5 " />
                          <span className="animate-pulse absolute h-[120%] w-[120%] rounded-full bg-secondary" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="shrink-0 rounded-full"
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={handleListenClick}
                        disabled={isLoading}
                      >
                        <Mic className="w-5 h-5 " />
                      </Button>
                    )}
                    <Button
                      className="shrink-0 rounded-full"
                      variant="ghost"
                      size="icon"
                      type="submit"
                      disabled={isLoading || !input.trim() || isListening}
                    >
                      <ArrowUp className="h-5 w-5 text-send" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex absolute right-4 items-center gap-1">
                    <Button
                      className="shrink-0 rounded-full"
                      variant="ghost"
                      size="icon"
                      type="button"
                      disabled={true}
                    >
                      <Mic className="w-5 h-5 " />
                    </Button>
                    <Button
                      className="shrink-0 rounded-full"
                      variant="ghost"
                      size="icon"
                      type="submit"
                      onClick={(e) => {
                        e.preventDefault();
                        stopAction();
                      }}
                    >
                      <StopIcon className="w-5 h-5  " />
                    </Button>
                  </div>
                )}

              </form>
            </div>
            {/*
            {base64Images && (
              <div className="flex px-2 pb-2 gap-2 ">
                {base64Images.map((image, index) => {
                  return (
                    <div key={index} className="relative bg-muted-foreground/20 flex w-fit flex-col gap-2 p-1 border-t border-x rounded-md">
                      <div className="flex text-sm">
                        <Image src={image} width={20} height={20}
                          className="h-auto rounded-md w-auto max-w-[100px] max-h-[100px]" alt={"Selected images"} />
                      </div>
                      <Button
                        onClick={() => {
                          const updatedImages = (prevImages: string[]) => prevImages.filter((_, i) => i !== index);
                          setBase64Images(updatedImages(base64Images));
                        }}
                        size='icon' className="absolute -top-1.5 -right-1.5 text-white cursor-pointer  bg-red-500 hover:bg-red-600 w-4 h-4 rounded-full flex items-center justify-center">
                        <Cross2Icon className="w-3 h-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
            */}
          </div>
        </div>
      </AnimatePresence>
      <p className="text-center text-xs text-muted-foreground/50">
        AI can make mistakes
      </p>
    </div>
  );
}
