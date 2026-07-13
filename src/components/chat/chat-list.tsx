import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getImagesFromMessage, getTextContentFromMessage } from "@/lib/utils";
import { parseAssistantContent } from "@/lib/parse-assistant-content";
import Image from "next/image";
import CodeDisplayBlock from "../code-display-block";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/button";
import { ChatProps } from "@/lib/types";
import DocumentReview from "../ui/document-review";
import {
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  RefreshCcw,
  Volume2,
  VolumeX,
} from "@econic";
import useChatStore from "@/hooks/useChatStore";
import ButtonWithTooltip from "../button-with-tooltip";
import ThinkingIndicator from "../ui/thinking-indicator";
import ThoughtSection from "../ui/thought-section";

const isLoadingMessage = (message: ChatProps["messages"][number]) =>
  message.loadingProgress !== undefined;

export default function ChatList({
  messages,
  loadingSubmit,
  onRegenerate,
  onRetry,
  loadingError,
}: ChatProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const prevMessageCountRef = useRef(0);
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

  const isLoading = useChatStore((state) => state.isLoading);

  const displayMessages = messages.filter((message) => !isLoadingMessage(message));

  const isNearBottom = () => {
    const el = scrollerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      userScrolledUpRef.current = !isNearBottom();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior) => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    const isNewMessage = displayMessages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = displayMessages.length;

    if (userScrolledUpRef.current && !isNewMessage) return;

    if (isNewMessage) {
      userScrolledUpRef.current = false;
    }

    const behavior: ScrollBehavior =
      isLoading && !isNewMessage ? "auto" : isNewMessage ? "smooth" : "auto";

    scrollToBottom(behavior);
  }, [displayMessages, isLoading]);

  const copyToClipboard = (response: string, index: number) => () => {
    navigator.clipboard.writeText(response);
    setisCopied((prevState) => ({ ...prevState, [index]: true }));
    setTimeout(() => {
      setisCopied((prevState) => ({ ...prevState, [index]: false }));
    }, 1500);
  };

  const handleTextToSpeech = (text: string, index: number) => {
    if (!textToSpeech) return;
    if (currentSpeakingIndex !== null) {
      speechSynthesis.cancel();
      setIsSpeaking((prevState) => ({
        ...prevState,
        [currentSpeakingIndex]: false,
      }));
    }
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

  const renderAssistantBody = (content: string) => {
    return content
      .split("```")
      .map((part: string, partIndex: number) => {
        if (partIndex % 2 === 0) {
          return (
            <Markdown key={partIndex} remarkPlugins={[remarkGfm]}>
              {part}
            </Markdown>
          );
        }

        return (
          <pre className="whitespace-pre-wrap pt-2" key={partIndex}>
            <CodeDisplayBlock code={part} lang="" />
          </pre>
        );
      });
  };

  if (displayMessages.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center p-5 md:p-0">
        <div className="relative flex flex-col gap-8 items-center justify-center w-full max-w-2xl mx-auto">
          <div className="flex flex-col gap-6 items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.7 }}
              transition={{ duration: 0.5 }}
              className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center"
            >
              <Image
                src="/offeline.png"
                alt="Offeline"
                width={224}
                height={224}
                className="w-full h-full object-contain"
              />
            </motion.div>

            <div className="space-y-4">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-body text-base md:text-lg text-muted-foreground max-w-lg mx-auto"
              >
                Chat privately with <span className="font-semibold text-foreground">llms</span> in your browser.
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="scroller"
      ref={scrollerRef}
      className="w-full overflow-y-auto overflow-x-hidden h-full justify-end"
    >
      <div className="w-full flex flex-col overflow-x-hidden overflow-y-hidden min-h-full justify-end px-4 pb-6 gap-9">
        {displayMessages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{
              opacity: { duration: 0.15 },
              y: { duration: 0.2, ease: "easeOut" },
            }}
            className="w-full"
          >
            {message.role === "user" && (
              <div className="ml-14 flex justify-end">
                <div className="max-w-[85%] rounded-[18px] bg-card px-5 py-3 font-body text-foreground">
                  {message.fileName && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileTextIcon className="h-4 w-4" />
                      {message.fileName}
                    </div>
                  )}
                  {getImagesFromMessage(message).length > 0 && (
                    <div className="mb-2 flex gap-2">
                      {getImagesFromMessage(message).map((image, imageIndex) => (
                        <Image
                          key={imageIndex}
                          src={image.url}
                          width={200}
                          height={200}
                          className="rounded-md object-contain"
                          alt=""
                        />
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">
                    {getTextContentFromMessage(message)}
                  </p>
                </div>
              </div>
            )}

            {message.role === "assistant" && (
              <div className="w-full">
                {(() => {
                  const rawContent = message.content?.toString() ?? "";
                  const { thought, body } = parseAssistantContent(rawContent);
                  const isLastMessage = index === displayMessages.length - 1;
                  const isThinking =
                    loadingSubmit &&
                    isLastMessage &&
                    !body &&
                    !message.isProcessingDocument;

                  return (
                    <>
                      {thought && <ThoughtSection thought={thought} />}

                      {message.isProcessingDocument ? (
                        <DocumentReview />
                      ) : isThinking ? (
                        <ThinkingIndicator />
                      ) : (
                        body && (
                          <div className="chat-prose overflow-x-auto">
                            {renderAssistantBody(body)}
                          </div>
                        )
                      )}

                      {body && (
                        <div className="mt-3 flex items-center gap-1 text-muted-foreground">
                          {(!isLoading || index !== displayMessages.length - 1) && (
                            <ButtonWithTooltip side="bottom" toolTipText="Copy">
                              <Button
                                onClick={copyToClipboard(
                                  getTextContentFromMessage(message),
                                  index
                                )}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                aria-label="Copy"
                              >
                                {isCopied[index] ? (
                                  <CheckIcon className="h-4 w-4" />
                                ) : (
                                  <CopyIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </ButtonWithTooltip>
                          )}

                          {!isLoading &&
                            !loadingError &&
                            index === displayMessages.length - 1 && (
                              <ButtonWithTooltip
                                side="bottom"
                                toolTipText="Regenerate"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full opacity-50 hover:opacity-100"
                                  onClick={onRegenerate}
                                  aria-label="Regenerate"
                                >
                                  <RefreshCcw className="h-4 w-4" />
                                </Button>
                              </ButtonWithTooltip>
                            )}

                          {loadingError && index === displayMessages.length - 1 && (
                            <ButtonWithTooltip side="bottom" toolTipText="Retry">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-orange-600/80 hover:text-orange-600"
                                onClick={onRetry}
                                aria-label="Retry"
                              >
                                <RefreshCcw className="h-4 w-4" />
                              </Button>
                            </ButtonWithTooltip>
                          )}

                          {(!isLoading || index !== displayMessages.length - 1) && (
                            <ButtonWithTooltip
                              side="bottom"
                              toolTipText={isSpeaking[index] ? "Stop" : "Listen"}
                            >
                              <Button
                                onClick={() => {
                                  handleTextToSpeech(
                                    getTextContentFromMessage(message),
                                    index
                                  );
                                }}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full opacity-50 hover:opacity-100"
                                aria-label={isSpeaking[index] ? "Stop" : "Listen"}
                              >
                                {isSpeaking[index] ? (
                                  <VolumeX className="h-4 w-4" />
                                ) : (
                                  <Volume2 className="h-4 w-4" />
                                )}
                              </Button>
                            </ButtonWithTooltip>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div id="anchor" ref={bottomRef}></div>
    </div>
  );
}
