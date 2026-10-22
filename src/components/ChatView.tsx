"use client";

import { useRouter } from "next/navigation";
import { ArrowDownCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useTransition, useCallback, useMemo } from "react";

import ScrollableFeed from "react-scrollable-feed";
import { ArrowDownIcon } from "@heroicons/react/24/solid";

import {
  ChatState,
  GPTMessage,
  Message as MessageType,
  SerializedMessage,
} from "@/typings";

import toast from "react-hot-toast";
import { Session } from "next-auth";
import { createChat } from "@/lib/chat";
import { validateSession } from "@/lib/utils";
import { isMobile } from "react-device-detect";
import { getPromptResponseStream } from "@/lib/prompt";
import { getTitleStream, saveTitle } from "@/lib/title";
import { Message, ChatInput, ChatHeader } from "@/components";

import {
  useChatState,
  useChatTitle,
  useChatRefs,
  useScrollManagement,
  useFirebaseMessages,
} from "@/hooks";

const CONSTANTS = {
  MAX_CONTEXT_MESSAGES: 10,
  MOUNT_DELAY: 1000,
  CHAT_AVATAR: "/chad.png",
  ASSISTANT_NAME: "Chad",
  ASSISTANT_ID: "chadgpt",
};

interface ChatViewProps {
  chatId: string;
  session: Session | null;
  initialMessages: SerializedMessage[];
  initialPrompt?: string;
  initialTitle?: string | null;
}

interface ScrollToBottomProps {
  isAtBottom: boolean;
  onScrollToBottom: () => void;
}

const ScrollToBottomButton = ({
  isAtBottom,
  onScrollToBottom,
}: ScrollToBottomProps) => {
  if (isAtBottom) return null;

  return (
    <div className="absolute bottom-32 right-5 lg:bottom-36 xl:right-24">
      <button
        type="button"
        onClick={onScrollToBottom}
        aria-label="Scroll to bottom"
        className="inline-flex items-center rounded-full bg-gray-300 bg-opacity-70 p-2 text-gray-600 shadow-sm transition-all duration-200 hover:bg-opacity-80 active:bg-gray-300 dark:bg-gray-500 dark:bg-opacity-70 dark:text-gray-100 dark:active:bg-gray-500"
      >
        <ArrowDownIcon className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
};

const EmptyState = () => (
  <>
    <p className="mt-10 text-center text-lg text-gray-700 dark:text-gray-300 md:text-xl">
      Write a prompt below to get started!
    </p>

    <ArrowDownCircleIcon
      className="mx-auto mt-5 h-9 w-9 animate-bounce text-gray-700 dark:text-gray-300"
      aria-hidden="true"
    />
  </>
);

const ChatView = ({
  chatId,
  session,
  initialMessages,
  initialPrompt,
  initialTitle,
}: ChatViewProps) => {
  const router = useRouter();
  const { streamingTitle, updateStreamingTitle } = useChatTitle();

  const [state, updateState]: [
    ChatState,
    (updates: Partial<ChatState>) => void,
  ] = useChatState({
    isSendingMessage: !!initialPrompt && initialMessages.length === 0,
  });

  const [isPending, startTransition] = useTransition();
  const { scrollableRef, scrollRef, textareaRef } = useChatRefs();

  const titleRequestedRef = useRef(false);
  const wasSendingMessageRef = useRef(false);
  const initialPromptHandledRef = useRef(false);

  const activeTurnControllerRef = useRef<AbortController | null>(null);

  const requestTitle = useCallback(
    async (
      sourceMessage?: string,
      signal?: AbortSignal,
    ): Promise<string | null> => {
      try {
        return await getTitleStream(
          chatId,
          (text) => {
            updateStreamingTitle(chatId, text);
          },
          sourceMessage,
          signal,
        );
      } catch (error) {
        updateStreamingTitle(chatId, "");

        if (!(error instanceof Error && error.name === "AbortError")) {
          console.error("Failed to generate chat title:", {
            error: error instanceof Error ? error.message : "Unknown error",
            chatId,
            timestamp: new Date().toISOString(),
          });
        }

        return null;
      }
    },
    [chatId, updateStreamingTitle],
  );

  useEffect(() => {
    if (
      wasSendingMessageRef.current &&
      !state.isSendingMessage &&
      textareaRef.current &&
      !isMobile
    ) {
      textareaRef.current.focus();
    }

    wasSendingMessageRef.current = state.isSendingMessage;
  }, [state.isSendingMessage, textareaRef]);

  useEffect(() => {
    const abortActiveTurn = () => activeTurnControllerRef.current?.abort();
    window.addEventListener("pagehide", abortActiveTurn);

    return () => {
      window.removeEventListener("pagehide", abortActiveTurn);
      abortActiveTurn();
    };
  }, []);

  const { displayMessages, isLoadingMessages, messagesError } =
    useFirebaseMessages(session, chatId, initialMessages);

  useEffect(() => {
    if (messagesError) {
      console.error("Failed to load chat messages:", {
        error: messagesError,
        chatId,
      });

      toast.error("Failed to load chat history. Please refresh the page.");
    }
  }, [messagesError, chatId]);

  const { updateIsAtBottomState, scrollToBottom } = useScrollManagement(
    scrollableRef,
    state.isAtBottom,
    displayMessages,
    state.streamingMessage,
    updateState,
  );

  const allMessages = useMemo(
    () => [
      ...displayMessages,
      ...(state.optimisticMessage &&
      !displayMessages.some((msg) => msg.id === state.optimisticMessage?.id)
        ? [state.optimisticMessage]
        : []),
      ...(state.streamingMessage &&
      !displayMessages.some((msg) => msg.id === state.streamingMessage?.id)
        ? [state.streamingMessage]
        : []),
    ],
    [displayMessages, state.optimisticMessage, state.streamingMessage],
  );

  /* 
    Clean up optimistic/streaming messages when they appear in real messages
  */
  useEffect(() => {
    const updates: Partial<ChatState> = {};

    if (
      state.streamingMessage &&
      displayMessages.some((msg) => msg.id === state.streamingMessage?.id)
    ) {
      updates.streamingMessage = null;
    }

    if (
      state.optimisticMessage &&
      displayMessages.some((msg) => msg.id === state.optimisticMessage?.id)
    ) {
      updates.optimisticMessage = null;
    }

    if (Object.keys(updates).length > 0) {
      updateState(updates);
    }
  }, [
    displayMessages,
    state.streamingMessage,
    state.optimisticMessage,
    updateState,
  ]);

  // mount handling
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateState({ isInitialized: true });
    }, CONSTANTS.MOUNT_DELAY);

    return () => clearTimeout(timeoutId);
  }, [updateState]);

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || !session?.user?.email) return;

      const text = input.trim();
      const turnId = crypto.randomUUID();
      const user = validateSession(session);

      const turnController = new AbortController();

      const isFirstMessage =
        initialMessages.length === 0 && displayMessages.length === 0;

      activeTurnControllerRef.current = turnController;

      updateState({
        isSendingMessage: true,
        optimisticMessage: {
          id: `${turnId}-user`,
          text,
          createdAt: new Date().toISOString(),
          user: {
            _id: user.email,
            name: user.name,
            avatar: user.avatar,
          },
        },
      });

      let titlePromise: Promise<string | null> | null = null;

      try {
        if (isFirstMessage && !initialTitle && !titleRequestedRef.current) {
          titleRequestedRef.current = true;
          titlePromise = requestTitle(text, turnController.signal);
        }

        const chatContext: GPTMessage[] = displayMessages
          .slice(-CONSTANTS.MAX_CONTEXT_MESSAGES)
          .map((msg: MessageType) => ({
            role:
              msg.user.name === CONSTANTS.ASSISTANT_NAME ? "assistant" : "user",
            content: msg.text.trim(),
          }));

        const outboundMessages: GPTMessage[] = [
          ...chatContext,
          { role: "user", content: text },
        ];

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const stream = await getPromptResponseStream(
          outboundMessages,
          chatId,
          turnId,
          timezone,
          turnController.signal,
        );

        // handle streaming response
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = "";

        (updateState as (updates: Partial<ChatState>) => void)({
          streamingMessage: {
            id: `${turnId}-assistant`,
            text: "",
            createdAt: new Date().toISOString(),
            user: {
              _id: CONSTANTS.ASSISTANT_ID,
              name: CONSTANTS.ASSISTANT_NAME,
              avatar: CONSTANTS.CHAT_AVATAR,
            },
          },
        });

        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            const chunkValue = decoder.decode(value, { stream: true });
            accumulatedResponse += chunkValue;

            updateState({
              streamingMessage: {
                id: `${turnId}-assistant`,
                text: accumulatedResponse,
                createdAt: new Date().toISOString(),
                user: {
                  _id: CONSTANTS.ASSISTANT_ID,
                  name: CONSTANTS.ASSISTANT_NAME,
                  avatar: CONSTANTS.CHAT_AVATAR,
                },
              },
            });
          }
        }

        decoder.decode();

        if (titlePromise) {
          const title = await titlePromise;

          if (title) {
            try {
              await saveTitle(chatId, title, turnController.signal);
            } catch (error) {
              if (!(error instanceof Error && error.name === "AbortError")) {
                console.error("Failed to save chat title:", {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                  chatId,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (error) {
        const wasAborted =
          turnController.signal.aborted ||
          (error instanceof Error && error.name === "AbortError");

        turnController.abort();
        titleRequestedRef.current = false;
        updateStreamingTitle(chatId, "");

        let errorMessage = "An unexpected error occurred. Please try again.";

        if (!wasAborted && error instanceof Error) {
          errorMessage = error.message;

          console.error("Error in sendMessage:", {
            error: error.message,
            chatId,
            userEmail: session?.user?.email,
            timestamp: new Date().toISOString(),
          });
        }

        if (!wasAborted) {
          toast.error(errorMessage);
        }

        updateState({ optimisticMessage: null, streamingMessage: null });
      } finally {
        if (activeTurnControllerRef.current === turnController) {
          activeTurnControllerRef.current = null;
        }

        updateState({ isSendingMessage: false });
      }
    },
    [
      session,
      chatId,
      displayMessages,
      initialMessages.length,
      initialTitle,
      requestTitle,
      updateStreamingTitle,
      updateState,
    ],
  );

  useEffect(() => {
    const hasUserMessage = displayMessages.some(
      (message) => message.user._id !== CONSTANTS.ASSISTANT_ID,
    );

    if (hasUserMessage && !initialTitle && !titleRequestedRef.current) {
      titleRequestedRef.current = true;
      void requestTitle();
    }
  }, [displayMessages, initialTitle, requestTitle]);

  useEffect(() => {
    if (
      initialPrompt &&
      !initialPromptHandledRef.current &&
      state.isInitialized
    ) {
      initialPromptHandledRef.current = true;
      window.history.replaceState(window.history.state, "", `/chat/${chatId}`);

      if (session?.user?.email && initialMessages.length === 0) {
        void sendMessage(initialPrompt);
      }
    }
  }, [
    chatId,
    initialPrompt,
    session,
    initialMessages.length,
    state.isInitialized,
    sendMessage,
  ]);

  const handleCreateChat = useCallback(async () => {
    if (state.isCreating) return;

    updateState({ isCreating: true });

    const createChatPromise = createChat({
      router,
      startTransition,
    }).finally(() => updateState({ isCreating: false }));

    toast.promise(createChatPromise, {
      loading: "Creating a new chat...",
      success: "New chat created!",
      error: "Error creating new chat.",
    });
  }, [state.isCreating, router, startTransition, updateState]);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100svh" }}>
      <ChatHeader
        title={
          streamingTitle?.chatId === chatId ? streamingTitle.text : initialTitle
        }
        isInitialized={state.isInitialized}
        isCreating={state.isCreating}
        isPending={isPending}
        onCreateChat={handleCreateChat}
      />

      <ScrollableFeed
        ref={scrollableRef}
        onScroll={(isAtBottom) => updateIsAtBottomState(isAtBottom)}
        className={`flex-1 ${
          !state.isAtBottom && "scroll-smooth"
        } scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 scrollbar-thumb-rounded-lg dark:scrollbar-thumb-gray-500`}
      >
        <div
          id="scrollDiv"
          ref={scrollRef}
          className="overflow-y-auto overflow-x-hidden"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {allMessages.length === 0 && !isLoadingMessages && !initialPrompt && (
            <EmptyState />
          )}

          {isLoadingMessages && (
            <div
              className="dot-spin m-auto mt-52"
              aria-label="Loading messages"
            />
          )}

          {!isLoadingMessages &&
            allMessages.map((message, i) => {
              const isChad = message.user.name === CONSTANTS.ASSISTANT_NAME;

              return (
                <Message
                  key={i}
                  message={message}
                  isChad={isChad}
                  isStreaming={
                    state.streamingMessage
                      ? i === allMessages.length - 1
                      : undefined
                  }
                />
              );
            })}

          <ScrollToBottomButton
            isAtBottom={state.isAtBottom}
            onScrollToBottom={scrollToBottom}
          />
        </div>
      </ScrollableFeed>

      <div className="mx-auto w-full max-w-2xl px-7 lg:px-0">
        <ChatInput
          session={session}
          chadProcessing={state.isSendingMessage}
          sendMessage={sendMessage}
          textareaRef={textareaRef}
        />
      </div>
    </div>
  );
};

export default ChatView;
