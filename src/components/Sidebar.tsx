"use client";

import { useChatList } from "@/hooks";
import { ChatSession } from "@/typings";
import { signOut } from "next-auth/react";
import { QuerySnapshot } from "firebase/firestore";
import { UserMenuSkeleton } from "@/components/skeletons";
import { memo, useState, useCallback, useMemo } from "react";
import { CreateControl, ExternalLink, ChatList, UserMenu } from "@/components";

const CONSTANTS = {
  LOGOUT_CALLBACK_URL: "/",
};

const Sidebar = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    session,
    status,
    chatsSnapshot,
    isLoadingChats,
    chatsError,
    isValidSession,
  } = useChatList();

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await signOut({ callbackUrl: CONSTANTS.LOGOUT_CALLBACK_URL });
    } catch (error) {
      console.error("Sidebar: Logout failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  const sidebarContent = useMemo(
    () => (
      <>
        <CreateControl />
        <ExternalLink />

        <div className="flex-1 overflow-y-auto overflow-x-hidden border-b border-gray-700 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#434654] scrollbar-thumb-rounded-lg">
          <div className="space-y-2">
            <ChatList
              chatsSnapshot={
                chatsSnapshot as QuerySnapshot<ChatSession> | undefined
              }
              isLoading={isLoadingChats}
              error={chatsError}
            />
          </div>
        </div>

        <div className="z-50 max-h-48 space-y-2">
          {status === "loading" ? (
            <UserMenuSkeleton />
          ) : (
            isValidSession && (
              <UserMenu session={session} onLogout={handleLogout} />
            )
          )}
        </div>
      </>
    ),
    [
      chatsSnapshot,
      isLoadingChats,
      chatsError,
      status,
      isValidSession,
      session,
      handleLogout,
    ],
  );

  return (
    <div
      className="hidden w-[16rem] max-w-[16rem] flex-col space-y-2 overflow-hidden bg-[#202123] p-2 md:flex"
      style={{ height: "100svh" }}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {sidebarContent}
    </div>
  );
};

export default memo(Sidebar);
