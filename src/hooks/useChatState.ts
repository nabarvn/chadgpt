import { ChatState } from "@/typings";
import { useState, useCallback } from "react";

/*
  Custom hook for managing chat state
*/
export function useChatState(
  initialOverrides: Partial<ChatState> = {},
): [ChatState, (updates: Partial<ChatState>) => void] {
  const [state, setState] = useState<ChatState>({
    isInitialized: false,
    isCreating: false,
    initialPromptSent: false,
    optimisticMessage: null,
    isSendingMessage: false,
    streamingMessage: null,
    isAtBottom: true,
    ...initialOverrides,
  });

  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  return [state, updateState];
}
