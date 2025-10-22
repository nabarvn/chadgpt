"use client";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CONTENT } from "@/config/showcase-content";
import { MobileHeader, Showcase } from "@/components";
import { createChat, CreateChatParams } from "@/lib/chat";
import { useState, useTransition, useCallback, useMemo } from "react";

import {
  BoltIcon,
  ExclamationTriangleIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

interface LobbyProps {
  isLoadingChats: boolean;
  hasEmptyChat: boolean;
}

const Lobby = ({ isLoadingChats, hasEmptyChat }: LobbyProps) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDisabled = useMemo(() => {
    return isLoadingChats || isCreating || isPending;
  }, [isLoadingChats, isCreating, isPending]);

  const handleCreateChat = useCallback(
    async (params: CreateChatParams = {}) => {
      if (isCreating) return;

      setIsCreating(true);

      const { loadingText, successText, ...rest } = params;

      const createChatPromise = createChat({
        ...rest,
        router,
        startTransition,
      }).finally(() => setIsCreating(false));

      toast.promise(createChatPromise, {
        loading: loadingText || "Creating a new chat...",
        success: successText || "New chat created!",
        error: (err) => err.message || "Error creating new chat.",
      });
    },
    [isCreating, router, startTransition],
  );

  const newChat = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (hasEmptyChat) {
        await handleCreateChat({
          loadingText: "Creating a new chat...",
          successText: "New chat created!",
        });
      }
    },
    [hasEmptyChat, handleCreateChat],
  );

  const handleExampleClick = useCallback(
    async (prompt: string) => {
      await handleCreateChat({
        prompt,
        loadingText: "Starting new chat...",
        successText: "Chat created!",
      });
    },
    [handleCreateChat],
  );

  const showcases = useMemo(
    () => [
      {
        icon: SunIcon,
        title: "Examples",
        items: CONTENT.EXAMPLES,
        isInteractive: true,
        onItemClick: handleExampleClick,
      },
      {
        icon: BoltIcon,
        title: "Capabilities",
        items: CONTENT.CAPABILITIES,
        isInteractive: false,
      },
      {
        icon: ExclamationTriangleIcon,
        title: "Limitations",
        items: CONTENT.LIMITATIONS,
        isInteractive: false,
      },
    ],
    [handleExampleClick],
  );

  return (
    <div
      className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-300 md:px-9"
      style={{ height: "100svh" }}
    >
      <MobileHeader onCreateChat={newChat} isDisabled={isDisabled} />

      <div className="overflow-y-auto overflow-x-hidden scrollbar-none scrollbar-track-transparent scrollbar-thumb-gray-300 scrollbar-thumb-rounded-lg dark:scrollbar-thumb-gray-500 md:scrollbar-thin">
        <h1 className="mb-9 mt-9 text-center text-5xl font-semibold md:mb-20 md:mt-0 lg:mb-14 xl:mb-16">
          ChadGPT
        </h1>

        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:space-x-5">
          {showcases.map((showcase) => (
            <Showcase
              key={showcase.title}
              icon={showcase.icon}
              title={showcase.title}
              items={showcase.items}
              isInteractive={showcase.isInteractive}
              onItemClick={showcase.onItemClick}
              isDisabled={isDisabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
