import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn, getImagesFromMessage, getTextContentFromMessage } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Image from "next/image";
import CodeDisplayBlock from "../code-display-block";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/button";
import { ChatProps } from "@/lib/types";
import MessageLoading from "../ui/message-loading";
import {
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  RefreshCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import useChatStore from "@/hooks/useChatStore";
import ButtonWithTooltip from "../button-with-tooltip";
import { AnimatedRobotAvatar } from "../ui/animated-robot-avatar";

export default function ChatList({
  messages,
  loadingSubmit,
  onRegenerate,
}: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [name, setName] = React.useState<string>("");
  const [localStorageIsLoading, setLocalStorageIsLoading] =
    React.useState(true);
  const [isCopied, setisCopied] = React.useState<Record<number, boolean>>({});
  const [textToSpeech, setTextToSpeech] =
    useState<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState<Record<number, boolean>>(
    {}
  );
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const utterance = new SpeechSynthesisUtterance();
      utterance.volume = 0.2;

      const setVoice = () => {
        const voices = speechSynthesis.getVoices();
        utterance.voice = voices[6];
        setTextToSpeech(utterance);
      };

      setVoice();

      speechSynthesis.addEventListener("voiceschanged", setVoice);

      return () => {
        speechSynthesis.cancel();
        speechSynthesis.removeEventListener("voiceschanged", setVoice);
      };
    }
  }, []);

  // Zustand
  const isLoading = useChatStore((state) => state.isLoading);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("chatty_user");
      if (username) {
        setName(username);
        setLocalStorageIsLoading(false);
      }
    }
  }, []);

  const copyToClipboard = (response: string, index: number) => () => {
    navigator.clipboard.writeText(response);
    setisCopied((prevState) => ({ ...prevState, [index]: true }));
    setTimeout(() => {
      setisCopied((prevState) => ({ ...prevState, [index]: false }));
    }, 1500);
  };

  const handleTextToSpeech = (text: string, index: number) => {
    if (!textToSpeech) return;
    // Stop the currently speaking text if any
    if (currentSpeakingIndex !== null) {
      speechSynthesis.cancel();
      setIsSpeaking((prevState) => ({
        ...prevState,
        [currentSpeakingIndex]: false,
      }));
    }
    // Start the new text-to-speech
    if (isSpeaking[index]) {
      speechSynthesis.cancel();
      setIsSpeaking((prevState) => ({ ...prevState, [index]: false }));
      setCurrentSpeakingIndex(null);
    } else {
      textToSpeech.text = text;
      speechSynthesis.speak(textToSpeech);
      setIsSpeaking((prevState) => ({ ...prevState, [index]: true }));
      setCurrentSpeakingIndex(index);

      textToSpeech.onend = () => {
        setIsSpeaking((prevState) => ({ ...prevState, [index]: false }));
        setCurrentSpeakingIndex(null);
      };
    }
  };

  if (messages.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center p-5 md:p-0">
        <div className="relative flex flex-col gap-8 items-center justify-center w-full max-w-2xl mx-auto">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-background to-fuchsia-500/5 blur-3xl -z-10" />
          
          {/* Main content */}
          <div className="flex flex-col gap-6 items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Image
                src="/chatbot.png"
                alt="AI"
                width={100}
                height={100}
                className="dark:invert"
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
              >
                How may I assist you?
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base md:text-lg text-muted-foreground/80 max-w-lg mx-auto"
              >
                Chat privately with<span className="font-semibold text-purple-500"> llms</span> in your browser.
              </motion.p>
            </div>

            {/* Quick start suggestions */}
            <div className="w-full max-w-[90vw] md:max-w-4xl overflow-hidden mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                {/* First row */}
                <motion.div
                  className="flex gap-2 md:gap-3 mb-2 md:mb-3 w-fit"
                >
                  {[
                    "Tell me about yourself",
                    "How can you help me with coding?",
                    "What are your capabilities?",
                    "Help me write code",
                    "Write a blog post",
                    "Debug my code",
                    "Explain programming concepts",
                    "Help with algorithms",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="shrink-0 text-[10px] md:text-sm text-muted-foreground bg-accent/30 px-2 md:px-4 py-1 md:py-2 rounded-lg border border-accent/50 whitespace-nowrap"
                    >
                      {text}
                    </div>
                  ))}
                </motion.div>

                {/* Second row - moves in opposite direction */}
                <motion.div
                  className="flex gap-2 md:gap-3 w-fit"
                >
                  {[
                    "Create a study plan",
                    "Generate test cases",
                    "Review my code",
                    "Explain machine learning",
                    "Help with research",
                    "Optimize my code",
                    "Design patterns",
                    "Convert to TypeScript",
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="shrink-0 text-[10px] md:text-sm text-muted-foreground bg-accent/30 px-2 md:px-4 py-1 md:py-2 rounded-lg border border-accent/50 whitespace-nowrap"
                    >
                      {text}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="scroller"
      className="w-full overflow-y-scroll overflow-x-hidden h-full justify-end"
    >
      <div className="w-full flex flex-col overflow-x-hidden overflow-y-hidden min-h-full justify-end">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, scale: 1, y: 20, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 1, y: 20, x: 0 }}
            transition={{
              opacity: { duration: 0.1 },
              layout: {
                type: "spring",
                bounce: 0.3,
                duration: messages.indexOf(message) * 0.025,
              },
            }}
            className={cn(
              "flex flex-col gap-2 p-4 whitespace-pre-wrap",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div className="flex gap-3 items-center">
              {message.role === "user" && (
                <div className="flex items-end gap-3">
                  <div className="bg-accent p-3 rounded-l-md rounded-tr-md max-w-xs sm:max-w-xl overflow-x-auto flex flex-col gap-2">
                    {message.fileName && (
                      <div className="flex items-center gap-2 border border-green-500 border-opacity-10 rounded-sm bg-green-500/10 p-2 text-sm">
                        <FileTextIcon className="w-4 h-4" />
                        {message.fileName}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {getImagesFromMessage(message).length > 0 && (
                        getImagesFromMessage(message).map((image, index) => (
                          <Image
                            key={index}
                            src={image.url}
                            width={200}
                            height={200}
                            className="rounded-md object-contain"
                            alt=""
                          />
                        ))
                      )}
                    </div>
                    <p>{getTextContentFromMessage(message)}</p>
                  </div>
                  <Avatar className="flex justify-start items-center overflow-hidden">
                    <AvatarImage
                      src="/"
                      alt="user"
                      width={6}
                      height={6}
                      className="object-contain"
                    />
                    <AvatarFallback>
                      {name && name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              {message.role === "assistant" && (
                <div className="flex items-end gap-2">
                  <Avatar className="flex justify-center rounded-full bg-card items-center">
                    <AnimatedRobotAvatar 
                      className={cn(
                        "text-foreground",
                        loadingSubmit && messages.indexOf(message) === messages.length - 1 
                          ? "animate-pulse" 
                          : ""
                      )}
                    />
                  </Avatar>
                  <span className="bg-accent p-3 rounded-r-md rounded-tl-md max-w-xs sm:max-w-xl overflow-x-auto">
                    {/* Show progress bar if loading */}
                    {message.loadingProgress !== undefined && (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <p className="text-sm">{message.content}</p>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${message.loadingProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{message.loadingProgress}%</p>
                      </div>
                    )}
                    
                    {/* Check if the message content contains a code block */}
                    {message.loadingProgress === undefined && message.content && message.content.toString()
                      .split("```")
                      .map((part: string, index: number) => {
                        if (index % 2 === 0) {
                          return (
                            <Markdown key={index} remarkPlugins={[remarkGfm]}>
                              {part}
                            </Markdown>
                          );
                        } else {
                          return (
                            <pre
                              className="whitespace-pre-wrap pt-2"
                              key={index}
                            >
                              <CodeDisplayBlock code={part} lang="" />
                            </pre>
                          );
                        }
                      })}

                    {/* Action buttons */}
                    <div className="pt-2 flex gap-1 items-center text-muted-foreground">
                      {/* Copy button */}
                      {(!isLoading ||
                        messages.indexOf(message) !== messages.length - 1) && (
                          <ButtonWithTooltip side="bottom" toolTipText="Copy">
                            <Button
                              onClick={copyToClipboard(getTextContentFromMessage(message), index)}
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                            >
                              {isCopied[index] ? (
                                <CheckIcon className="w-3.5 h-3.5 transition-all" />
                              ) : (
                                <CopyIcon className="w-3.5 h-3.5 transition-all" />
                              )}
                            </Button>
                          </ButtonWithTooltip>
                        )}

                      {/* Only show regenerate button on the last ai message */}
                      {!isLoading &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <ButtonWithTooltip
                            side="bottom"
                            toolTipText="Regenerate"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={onRegenerate}
                            >
                              <RefreshCcw className="w-3.5 h-3.5 scale-100 transition-all" />
                            </Button>
                          </ButtonWithTooltip>
                        )}

                      {/* Speaker icon */}
                      {(!isLoading ||
                        messages.indexOf(message) !== messages.length - 1) && (
                          <ButtonWithTooltip
                            side="bottom"
                            toolTipText={isSpeaking[index] ? "Stop" : "Listen"}
                          >
                            <Button
                              onClick={() => {
                                handleTextToSpeech(getTextContentFromMessage(message), index);
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                            >
                              {isSpeaking[index] ? (
                                <VolumeX className="w-4 h-4 transition-all " />
                              ) : (
                                <Volume2 className="w-4 h-4 transition-all" />
                              )}
                            </Button>
                          </ButtonWithTooltip>
                        )}
                    </div>

                    {/* Loading dots */}
                    {loadingSubmit &&
                      messages.indexOf(message) === messages.length - 1 && (
                        <MessageLoading />
                      )}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <div id="anchor" ref={bottomRef}></div>
    </div>
  );
}
