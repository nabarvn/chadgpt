import { useRef } from "react";
import ScrollableFeed from "react-scrollable-feed";

export interface ScrollRefs {
  scrollableRef: React.RefObject<ScrollableFeed>;
  scrollRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

/*
  Custom hook for managing chat-related refs
*/
export function useChatRefs(): ScrollRefs {
  return {
    scrollableRef: useRef<ScrollableFeed>(null),
    scrollRef: useRef<HTMLDivElement>(null),
    textareaRef: useRef<HTMLTextAreaElement>(null),
  };
}
