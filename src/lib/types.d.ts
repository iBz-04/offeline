import { ChatCompletionMessageParam } from "@mlc-ai/web-llm";

export interface ChatLayoutProps {
  chatId: string;
}

export interface ChatProps {
  chatId?: string;
  messages: Message[];
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  loadingSubmit?: boolean;
  stop: () => void;
  isMobile?: boolean;
  onRegenerate?: () => void;
  onRetry?: () => void;
  loadingError?: string | null;
  isModelLoading?: boolean;
}

export interface MessageWithFile extends ChatCompletionMessageParam {
  chatTitle?: string;
  fileName?: string;
  loadingProgress?: number;
  isProcessingDocument?: boolean;
}

export type MergedProps = ChatLayoutProps & ChatProps;

export type MessageWithFiles = MessageWithFile & ChatCompletionMessageParam;
