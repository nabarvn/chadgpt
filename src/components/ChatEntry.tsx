"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { Session } from "next-auth";
import { useChatTitle } from "@/hooks";
import { deleteChat } from "@/lib/chat";
import { isMobile } from "react-device-detect";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useMemo, useRef } from "react";
import { useSession, SessionContextValue } from "next-auth/react";
import { ChatBubbleLeftIcon, TrashIcon } from "@heroicons/react/24/outline";

const CONSTANTS = {
  DEFAULT_CHAT_TEXT: "New Chat",
};

interface ChatEntryProps {
  chatId: string;
  title?: string | null;
}

function validateChatId(chatId: string): boolean {
  return Boolean(chatId?.trim() && chatId.length > 0);
}

function validateSession(session: Session | null): {
  isValid: boolean;
  userEmail?: string;
} {
  if (!session?.user?.email) {
    return { isValid: false };
  }

  return {
    isValid: true,
    userEmail: session.user.email,
  };
}

async function handleChatDeletion(
  chatId: string,
  isCurrentChat: boolean,
  router: ReturnType<typeof useRouter>,
): Promise<void> {
  if (!validateChatId(chatId)) {
    throw new Error("Invalid chat ID");
  }

  await deleteChat(chatId);

  if (isCurrentChat) {
    router.push("/");
  }
}

const ChatEntry = ({ chatId, title }: ChatEntryProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { streamingTitle } = useChatTitle();

  const { data: session }: SessionContextValue = useSession();

  const [isDeleting, setIsDeleting] = useState(false);
  const trashIconRef = useRef<SVGSVGElement>(null);

  const isValidChatId = useMemo(() => validateChatId(chatId), [chatId]);

  const { isValid: isValidSession } = useMemo(
    () => validateSession(session),
    [session],
  );

  const isActive = useMemo(() => {
    return Boolean(pathname?.includes(chatId));
  }, [pathname, chatId]);

  const displayText = useMemo(() => {
    if (streamingTitle?.chatId === chatId && streamingTitle.text) {
      return streamingTitle.text;
    }

    return title || CONSTANTS.DEFAULT_CHAT_TEXT;
  }, [chatId, streamingTitle, title]);

  const deleteChat = useCallback(
    async (e: React.MouseEvent<SVGSVGElement>) => {
      e.preventDefault();
      e.stopPropagation();

      trashIconRef.current?.blur();

      if (!isValidSession) {
        toast.error("Authentication required to delete chat.");
        return;
      }

      if (isDeleting) return;
      setIsDeleting(true);

      const deleteChatPromise = handleChatDeletion(
        chatId,
        isActive,
        router,
      ).catch((error) => {
        setIsDeleting(false);
        throw error;
      });

      toast.promise(deleteChatPromise, {
        loading: "Deleting chat...",
        success: "Chat deleted!",
        error: (err) => err.message || "Failed to delete chat.",
      });
    },
    [chatId, isActive, isDeleting, isValidSession, router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        deleteChat(e as unknown as React.MouseEvent<SVGSVGElement>);
      }
    },
    [deleteChat],
  );

  if (!isValidChatId) {
    console.error("ChatEntry: Invalid chat ID provided:", chatId);
    return null;
  }

  return (
    <Link
      href={`/chat/${chatId}`}
      className={`chatRow group justify-center ${
        isActive
          ? "bg-gray-700/50 pr-2.5"
          : isMobile
            ? "pr-2.5"
            : "pr-1 hover:pr-2.5"
      } px-3 py-3 outline-none`}
      aria-label={`Chat: ${displayText || CONSTANTS.DEFAULT_CHAT_TEXT}`}
      aria-current={isActive ? "page" : undefined}
    >
      <ChatBubbleLeftIcon
        className="h-4 w-4 text-gray-500"
        aria-hidden="true"
      />

      <p className="relative w-0 flex-1 truncate text-gray-300">
        <span aria-label="Chat title">{displayText}</span>

        <span
          className={`absolute inset-y-0 right-0 z-10 h-7 w-9 ${
            !isActive && "bg-gradient-to-l"
          } from-[#202123] opacity-90 group-hover:bg-none`}
          aria-hidden="true"
        />
      </p>

      <TrashIcon
        ref={trashIconRef}
        onClick={deleteChat}
        onKeyDown={handleKeyDown}
        className={`shrink-0 rounded-sm text-gray-500 transition duration-300 focus:outline-none focus-visible:outline-2 focus-visible:outline-gray-100 ${
          isDeleting
            ? "h-4 w-4 cursor-default opacity-50"
            : `h-1 w-1 group-hover:h-4 group-hover:w-4 ${
                (isActive || isMobile) && "h-4 w-4"
              } opacity-0 group-hover:opacity-100 ${
                (isActive || isMobile) && "opacity-100"
              } hover:text-red-500`
        }`}
        role="button"
        tabIndex={isDeleting ? -1 : 0}
        aria-label={`Delete chat: ${
          displayText || CONSTANTS.DEFAULT_CHAT_TEXT
        }`}
        aria-disabled={isDeleting}
      />
    </Link>
  );
};

export default ChatEntry;
