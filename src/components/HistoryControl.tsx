"use client";

import toast from "react-hot-toast";
import { Session } from "next-auth";
import { db } from "@/firebase/client";
import { useRouter } from "next/navigation";
import { deleteAllChats } from "@/lib/chat";
import { useSession } from "next-auth/react";
import { useState, useCallback, useMemo } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { CheckIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";

import {
  collection,
  orderBy,
  query,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

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

function validateChatsExist(
  chatDocs: QueryDocumentSnapshot<DocumentData>[] | undefined,
): boolean {
  return Boolean(chatDocs && chatDocs.length > 0);
}

async function handleBulkChatDeletion(
  router: ReturnType<typeof useRouter>,
): Promise<void> {
  await deleteAllChats();
  router.push("/");
}

const HistoryControl = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { isValid: isValidSession, userEmail } = useMemo(
    () => validateSession(session),
    [session],
  );

  const [chatsSnapshot, isLoadingChats, chatsError] = useCollection(
    isValidSession && userEmail
      ? query(
          collection(db, "users", userEmail, "chats"),
          orderBy("createdAt", "asc"),
        )
      : null,
  );

  const hasChats = useMemo(
    () => validateChatsExist(chatsSnapshot?.docs),
    [chatsSnapshot?.docs],
  );

  const handleShowConfirmation = useCallback(() => {
    if (!isValidSession) {
      toast.error("Authentication required to delete chats.");
      return;
    }

    if (!hasChats) {
      toast.error("No chats to delete.");
      return;
    }

    setShowConfirmation(true);
  }, [isValidSession, hasChats]);

  const handleCancelConfirmation = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
      }
    },
    [],
  );

  const deleteAllChats = useCallback(async () => {
    if (!isValidSession) {
      toast.error("Authentication required to delete chats.");
      return;
    }

    if (!hasChats) {
      toast.error("No chats to delete.");
      setShowConfirmation(false);
      return;
    }

    if (isDeleting) return;

    setIsDeleting(true);

    const deleteAllChatsPromise = handleBulkChatDeletion(router)
      .then(() => {
        setShowConfirmation(false);
      })
      .finally(() => {
        setIsDeleting(false);
      });

    toast.promise(deleteAllChatsPromise, {
      loading: "Clearing all chats...",
      success: "All chats cleared!",
      error: (err) => err.message || "Error clearing all chats.",
    });
  }, [isValidSession, hasChats, isDeleting, router]);

  if (chatsError) {
    console.error("HistoryControl Firebase error:", {
      error: chatsError.message,
      userEmail,
      timestamp: new Date().toISOString(),
    });
  }

  if (!isValidSession) {
    return null;
  }

  if (isLoadingChats) {
    return (
      <div className="adminRow h-[44px]">
        <div className="h-4 w-4 animate-pulse rounded-full bg-gray-700" />
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-700" />
      </div>
    );
  }

  return (
    <>
      <div
        className={`adminRow ${
          !chatsSnapshot?.docs.length && "cursor-default hover:bg-[#202123]"
        } w-full ${showConfirmation && "hidden cursor-default !space-x-0"}`}
        onClick={() => {
          if (chatsSnapshot?.docs.length) {
            handleShowConfirmation();
          }
        }}
        onKeyDown={
          chatsSnapshot?.docs.length
            ? (e) => handleKeyDown(e, handleShowConfirmation)
            : undefined
        }
        role="button"
        tabIndex={chatsSnapshot?.docs.length ? 0 : -1}
        aria-label="Clear conversations"
        aria-disabled={!chatsSnapshot?.docs.length}
      >
        <TrashIcon className="h-4 w-4 text-gray-500 transition duration-100" />

        <p className="text-gray-300 transition duration-100">
          Clear conversations
        </p>
      </div>

      <div
        className={`flex cursor-default items-center justify-between ${
          showConfirmation ? "block" : "hidden"
        } !mt-0 w-full rounded-lg bg-gray-700/70 py-3 pl-4 pr-3 text-sm text-gray-300`}
        role="dialog"
        aria-labelledby="confirm-title"
        aria-busy={isDeleting}
      >
        <p id="confirm-title">{isDeleting ? "Clearing..." : "You sure?"}</p>

        <div className="flex items-center" aria-live="polite">
          {isDeleting ? (
            <div
              className="flex w-10 items-center justify-center pr-1"
              role="status"
            >
              <span className="dot-elastic" aria-hidden="true" />
              <span className="sr-only">Clearing...</span>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={deleteAllChats}
                onKeyDown={(e) => handleKeyDown(e, deleteAllChats)}
                aria-label="Confirm deletion"
              >
                <CheckIcon className="h-4 w-4 cursor-default hover:text-[#202123]" />
              </button>

              <button
                onClick={handleCancelConfirmation}
                onKeyDown={(e) => handleKeyDown(e, handleCancelConfirmation)}
                aria-label="Cancel deletion"
              >
                <XMarkIcon className="h-4 w-4 cursor-default hover:text-[#202123]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryControl;
