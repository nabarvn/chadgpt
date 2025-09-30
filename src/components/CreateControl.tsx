"use client";

import toast from "react-hot-toast";
import { createChat } from "@/lib/chat";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useState, useTransition, useCallback, useMemo } from "react";

interface CreateControlProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const CreateControl = ({
  onClick,
  disabled = false,
  className = "",
}: CreateControlProps) => {
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDisabled = useMemo(
    () => disabled || isCreating || isPending,
    [disabled, isCreating, isPending],
  );

  const buttonClasses = `w-full border border-gray-700 chatRow px-3 py-3 ${
    isDisabled ? "cursor-default hover:bg-[#202123] opacity-50" : ""
  } ${className}`.trim();

  const handleCreateChat = useCallback(async () => {
    if (isDisabled) return;

    setIsCreating(true);

    const createChatPromise = createChat({
      router,
      startTransition,
    })
      .catch((error) => {
        console.error("Chat creation failed:", {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });

        throw error;
      })
      .finally(() => {
        setIsCreating(false);
      });

    toast.promise(createChatPromise, {
      loading: "Creating a new chat...",
      success: "New chat created!",
      error: (err) => err.message || "Failed to create chat.",
    });
  }, [isDisabled, router, startTransition]);

  const handleClick = useCallback(() => {
    handleCreateChat();
    onClick?.();
  }, [handleCreateChat, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={buttonClasses}
      disabled={isDisabled}
      aria-label="New chat"
      aria-disabled={isDisabled}
      type="button"
    >
      <PlusIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <p className="text-gray-300">New chat</p>
    </button>
  );
};

export default CreateControl;
