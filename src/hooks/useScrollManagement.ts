import { useEffect, useCallback } from "react";
import ScrollableFeed from "react-scrollable-feed";
import { ChatState, Message as MessageType } from "@/typings";

/*
  Custom hook for managing scroll behavior
*/
export function useScrollManagement(
  scrollableRef: React.RefObject<ScrollableFeed>,
  isAtBottom: boolean,
  messages: MessageType[],
  streamingMessage: MessageType | null,
  updateState: (updates: Partial<ChatState>) => void,
) {
  const updateIsAtBottomState = useCallback(
    (result: boolean) => {
      updateState({ isAtBottom: result });
    },
    [updateState],
  );

  const scrollToBottom = useCallback(() => {
    scrollableRef.current?.scrollToBottom();
  }, [scrollableRef]);

  useEffect(() => {
    if (scrollableRef.current && isAtBottom) {
      scrollableRef.current.scrollToBottom();
    }
  }, [messages, isAtBottom, streamingMessage, scrollableRef]);

  return { updateIsAtBottomState, scrollToBottom };
}
