"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface StreamingTitle {
  chatId: string;
  text: string;
}

interface ChatTitleContextValue {
  streamingTitle: StreamingTitle | null;
  updateStreamingTitle: (chatId: string, text: string) => void;
}

const ChatTitleContext = createContext<ChatTitleContextValue | null>(null);

export function ChatTitleProvider({ children }: PropsWithChildren) {
  const [streamingTitle, setStreamingTitle] = useState<StreamingTitle | null>(
    null,
  );

  const updateStreamingTitle = useCallback((chatId: string, text: string) => {
    setStreamingTitle({ chatId, text });
  }, []);

  const value = useMemo(
    () => ({ streamingTitle, updateStreamingTitle }),
    [streamingTitle, updateStreamingTitle],
  );

  return (
    <ChatTitleContext.Provider value={value}>
      {children}
    </ChatTitleContext.Provider>
  );
}

export function useChatTitle(): ChatTitleContextValue {
  const context = useContext(ChatTitleContext);

  if (!context) {
    throw new Error("useChatTitle must be used within ChatTitleProvider");
  }

  return context;
}
