"use client";

import toast from "react-hot-toast";
import { useChatList } from "@/hooks";
import { ChatSession } from "@/typings";
import { signOut } from "next-auth/react";
import { Disclosure } from "@headlessui/react";
import { QuerySnapshot } from "firebase/firestore";
import { useState, useCallback, useMemo } from "react";
import { UserMenuSkeleton } from "@/components/skeletons";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { CreateControl, ExternalLink, ChatList, UserMenu } from "@/components";

const CONSTANTS = {
  LOGOUT_CALLBACK_URL: "/",
  SIDEBAR_WIDTH: "16rem",
  ANIMATION_DURATION: "duration-200",
};

async function handleUserLogout(): Promise<void> {
  try {
    await signOut({ callbackUrl: CONSTANTS.LOGOUT_CALLBACK_URL });
  } catch (error) {
    console.error("Logout failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    throw new Error("Failed to log out. Please try again.");
  }
}

const SlideOver = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    session,
    status,
    chatsSnapshot,
    isLoadingChats,
    chatsError,
    isValidSession,
  } = useChatList();

  const handleToggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleChatClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleMenuAction = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    const logoutPromise = handleUserLogout()
      .catch((error) => {
        console.error("SlideOver: Logout failed:", {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });

        throw error;
      })
      .finally(() => {
        setIsLoggingOut(false);
      });

    toast.promise(logoutPromise, {
      loading: "Signing out...",
      success: "You've signed out!",
      error: (err) => err.message || "Failed to log out. Please try again.",
    });
  }, [isLoggingOut]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggleSidebar();
      }
    },
    [handleToggleSidebar],
  );

  const sidebarClasses = useMemo(
    () =>
      `flex flex-col md:hidden bg-[#202123] w-[${
        CONSTANTS.SIDEBAR_WIDTH
      }] max-w-[${CONSTANTS.SIDEBAR_WIDTH}] z-20 fixed top-0 ${
        isOpen ? "left-0" : "-left-96"
      } lg:left-0 lg:w-[${
        CONSTANTS.SIDEBAR_WIDTH
      }] peer-focus:left-0 peer:transition lg:transition-none ease-out delay-150 ${
        CONSTANTS.ANIMATION_DURATION
      } space-y-2 p-2`,
    [isOpen],
  );

  const overlayClasses = useMemo(
    () =>
      `md:hidden ${
        !isOpen && "hidden"
      } fixed inset-0 h-screen z-10 bg-black/10 backdrop-blur-sm`,
    [isOpen],
  );

  return (
    <>
      <Disclosure as="nav">
        <Disclosure.Button
          onClick={handleToggleSidebar}
          onKeyDown={handleKeyDown}
          className="peer fixed left-1 top-1 z-10 ml-2 block items-center justify-center rounded-md p-1 text-gray-300 transition-colors duration-200 hover:bg-gray-900 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-300 md:hidden"
          aria-label="Open sidebar menu"
          aria-expanded={isOpen}
        >
          <Bars3Icon className="h-7 w-7" aria-hidden="true" />
        </Disclosure.Button>

        <div className={sidebarClasses} style={{ height: "100svh" }}>
          <header className="space-y-2">
            <CreateControl onClick={handleCloseSidebar} />
            <ExternalLink />
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden border-b border-gray-700 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#434654] scrollbar-thumb-rounded-lg">
            <ChatList
              chatsSnapshot={
                chatsSnapshot as QuerySnapshot<ChatSession> | undefined
              }
              isLoading={isLoadingChats}
              error={chatsError}
              onChatClick={handleChatClick}
            />
          </main>

          <footer className="z-50 max-h-48 space-y-2">
            {status === "loading" ? (
              <UserMenuSkeleton />
            ) : (
              isValidSession && (
                <UserMenu
                  session={session}
                  onLogout={handleLogout}
                  onMenuAction={handleMenuAction}
                />
              )
            )}
          </footer>
        </div>

        <button
          onClick={handleCloseSidebar}
          className={`fixed top-1 z-30 block items-center justify-center rounded-md p-1 text-gray-300 ring-2 ring-inset ring-gray-300 transition-all delay-150 duration-200 ease-out md:hidden ${
            isOpen ? "left-[16.25rem] opacity-100" : "-left-96 opacity-0"
          }`}
          aria-label="Close sidebar"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </Disclosure>

      <div
        onClick={handleCloseSidebar}
        className={overlayClasses}
        aria-label="Close sidebar"
        role="button"
        tabIndex={isOpen ? 0 : -1}
      />
    </>
  );
};

export default SlideOver;
