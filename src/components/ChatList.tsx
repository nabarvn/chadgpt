import { memo, useMemo } from "react";
import { ChatEntry } from "@/components";
import { validateChatsData } from "@/lib/utils";
import { QuerySnapshot } from "firebase/firestore";
import { ChatSession, FirebaseDoc } from "@/typings";
import { ChatEntrySkeleton } from "@/components/skeletons";

const CONSTANTS = {
  SKELETON_COUNT: 6,
};

const ChatList = memo(
  ({
    chatsSnapshot,
    isLoading,
    error,
    onChatClick,
  }: {
    chatsSnapshot: QuerySnapshot<ChatSession> | undefined;
    isLoading: boolean;
    error: Error | undefined;
    onChatClick?: () => void;
  }) => {
    const validChats = useMemo(() => {
      if (!validateChatsData(chatsSnapshot)) return [];
      return chatsSnapshot?.docs || [];
    }, [chatsSnapshot]);

    if (error) {
      console.error("Sidebar: Error loading chats:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return (
        <div className="text-center text-gray-300">
          <p className="mt-9" role="alert">
            Error occurred while loading chats...
          </p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="space-y-2" aria-label="Loading chats">
          {Array.from({ length: CONSTANTS.SKELETON_COUNT }, (_, i) => (
            <ChatEntrySkeleton key={i} />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2" role="list" aria-label="Chat history">
        {validChats.map((chat: FirebaseDoc<ChatSession>) => (
          <div key={chat.id} role="listitem" onClick={onChatClick}>
            <ChatEntry chatId={chat.id} />
          </div>
        ))}
      </div>
    );
  },
);

export default ChatList;
