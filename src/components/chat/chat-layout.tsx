"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon, DocAdd } from "@econic";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Chat from "./chat";
import { MergedProps } from "@/lib/types";
import { Button } from "../ui/button";
import useChatStore from "@/hooks/useChatStore";
import { useRouter } from "next/navigation";
import useMemoryStore from "@/hooks/useMemoryStore";
import ButtonWithTooltip from "../button-with-tooltip";
import ExportChatDialog from "../export-chat-dialog";

export default function ChatLayout({
  messages,
  stopAction,
  chatId,
  loadingSubmit,
  handleSubmitAction,
  onRegenerate,
  onRetry,
  loadingError,
  isModelLoading,
}: MergedProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const setStoredMessages = useChatStore((state) => state.setMessages);
  const setFiles = useChatStore((state) => state.setFiles);
  const setFileText = useChatStore((state) => state.setFileText);
  const setChatId = useMemoryStore((state) => state.setChatId);
  const router = useRouter();

  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const collapsed = localStorage.getItem("chat-collapsed");
      if (collapsed === "true") {
        setIsCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-collapsed", isCollapsed.toString());
    }
  }, [isCollapsed]);

  const handleNewChat = () => {
    // Clear messages
    stop();
    setTimeout(() => {
      setStoredMessages(() => []);
      setChatId("");
      setFiles(undefined);
      setFileText(null);
      router.push("/");
    }, 50);
  };

  return (
    <div className="flex relative w-full h-full">
      <AnimatePresence>
        <motion.div
          key="sidebar"
          animate={{ width: isCollapsed ? 0 : 288 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-72 hidden md:block shrink-0 h-full"
        >
          <Sidebar isCollapsed={isCollapsed} chatId={chatId} stopAction={stopAction} />
        </motion.div>
        <div
          key="divider"
          className=" items-center relative left-1 hidden md:flex"
        >
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-8 w-8 rounded-full"
                >
                  {isCollapsed ? (
                    <ChevronRightIcon className="h-6 w-6" />
                  ) : (
                    <ChevronLeftIcon className="h-6 w-6" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand" : "Collapse"} sidebar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          <motion.div
            key="new-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: isCollapsed ? 1 : 0 }}
            transition={{
              duration: isCollapsed ? 0.2 : 0,
              ease: "easeInOut",
              delay: isCollapsed ? 0.2 : 0,
            }}
            className="hidden md:flex"
          >
            <ButtonWithTooltip side="right" toolTipText="New chat">
              <Button
                variant="ghost"
                className="absolute gap-3 left-4 top-5 rounded-full"
                size="icon"
                disabled={!isCollapsed}
                onClick={() => {
                  handleNewChat();
                }}
              >
                <DocAdd size={18} className="shrink-0 w-5 h-5" />
              </Button>
            </ButtonWithTooltip>
          </motion.div>
        </div>
      </AnimatePresence>
      <div className="h-full w-full flex flex-col items-center justify-center overflow-hidden">
        <Chat
          messages={messages}
          handleSubmitAction={handleSubmitAction}
          stopAction={stopAction}
          chatId={chatId}
          loadingSubmit={loadingSubmit}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
          loadingError={loadingError}
          isModelLoading={isModelLoading}
        />

        <ExportChatDialog open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}
