"use client";

import { db } from "@/firebase/client";
import { useRouter } from "next/navigation";
import { ArrowDownCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useTransition, useCallback, useMemo } from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  DocumentReference,
  DocumentData,
  Timestamp,
} from "firebase/firestore";

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
import { Message, ChatInput, ChatHeader } from "@/components";

import {
  useChatState,
  useChatRefs,
  useScrollManagement,
  useFirebaseMessages,
} from "@/hooks";

const CONSTANTS = {
  MODEL: "gpt-4.1-nano",
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
}: ChatViewProps) => {
  const router = useRouter();

  const [state, updateState]: [
    ChatState,
    (updates: Partial<ChatState>) => void,
  ] = useChatState({
    isSendingMessage: !!initialPrompt && initialMessages.length === 0,
  });

  const [isPending, startTransition] = useTransition();

  const { scrollableRef, scrollRef, textareaRef } = useChatRefs();

  const wasSendingMessage = useRef(false);

  useEffect(() => {
    if (
      wasSendingMessage.current &&
      !state.isSendingMessage &&
      textareaRef.current &&
      !isMobile
    ) {
      textareaRef.current.focus();
    }

    wasSendingMessage.current = state.isSendingMessage;
  }, [state.isSendingMessage, textareaRef]);

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
      !displayMessages.some((msg) => msg.text === state.optimisticMessage?.text)
        ? [state.optimisticMessage]
        : []),
      ...(state.streamingMessage &&
      !displayMessages.some((msg) => msg.text === state.streamingMessage?.text)
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
      displayMessages.some((msg) => msg.text === state.streamingMessage?.text)
    ) {
      updates.streamingMessage = null;
    }

    if (
      state.optimisticMessage &&
      displayMessages.some((msg) => msg.text === state.optimisticMessage?.text)
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

      updateState({ isSendingMessage: true });

      let userMessageRef: DocumentReference<DocumentData> | null = null;

      try {
        const user = validateSession(session);

        const message: Omit<MessageType, "id"> = {
          text: input.trim(),
          createdAt: serverTimestamp() as Timestamp,
          user: {
            _id: user.email,
            name: user.name,
            avatar: user.avatar,
          },
        };

        userMessageRef = await addDoc(
          collection(db, "users", user.email, "chats", chatId, "messages"),
          message,
        );

        const chatContext: GPTMessage[] = displayMessages
          .slice(-CONSTANTS.MAX_CONTEXT_MESSAGES)
          .map((msg: MessageType) => ({
            role:
              msg.user.name === CONSTANTS.ASSISTANT_NAME ? "assistant" : "user",
            content: msg.text.trim(),
          }));

        const outboundMessages: GPTMessage[] = [
          ...chatContext,
          { role: "user", content: input.trim() },
        ];

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const stream = await getPromptResponseStream(
          outboundMessages,
          chatId,
          CONSTANTS.MODEL,
          session,
          timezone,
        );

        // handle streaming response
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = "";

        (updateState as (updates: Partial<ChatState>) => void)({
          streamingMessage: {
            id: "ai-response",
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
            const chunkValue = decoder.decode(value);
            accumulatedResponse += chunkValue;

            updateState({
              streamingMessage: {
                id: "ai-response",
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
      } catch (error) {
        if (userMessageRef) {
          try {
            await deleteDoc(userMessageRef);
          } catch (deleteError) {
            console.error("Error deleting user message:", deleteError);
          }
        }

        let errorMessage = "An unexpected error occurred. Please try again.";

        if (error instanceof Error) {
          errorMessage = error.message;

          console.error("Error in sendMessage:", {
            error: error.message,
            chatId,
            userEmail: session?.user?.email,
            timestamp: new Date().toISOString(),
          });
        }

        toast.error(errorMessage);
        updateState({ streamingMessage: null });
      } finally {
        updateState({ isSendingMessage: false });
      }
    },
    [session, chatId, displayMessages, updateState],
  );

  useEffect(() => {
    if (
      initialPrompt &&
      !state.initialPromptSent &&
      session?.user?.email &&
      displayMessages.length === 0 &&
      state.isInitialized
    ) {
      updateState({ initialPromptSent: true });
      sendMessage(initialPrompt);
    }
  }, [
    initialPrompt,
    state.initialPromptSent,
    session,
    displayMessages.length,
    state.isInitialized,
    sendMessage,
    updateState,
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
        displayMessages={displayMessages}
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
          {displayMessages.length === 0 &&
            !isLoadingMessages &&
            !initialPrompt && <EmptyState />}

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
