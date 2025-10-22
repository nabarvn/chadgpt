import { db } from "@/firebase/client";
import { getAuthSession } from "@/lib/auth";
import { Lobby } from "@/components";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";

interface LobbyState {
  isLoadingChats: boolean;
  hasNewChatAvailable: boolean;
}

/*
  Checks if the user has an existing empty chat that can be reused
*/
async function checkForEmptyChat(userEmail: string): Promise<boolean> {
  try {
    const chatsCollection: CollectionReference<DocumentData> = collection(
      db,
      "users",
      userEmail,
      "chats",
    );

    const latestChatQuery = query(
      chatsCollection,
      orderBy("createdAt", "desc"),
      limit(1),
    );

    const latestChatSnapshot = await getDocs(latestChatQuery);

    // no chats exist
    if (latestChatSnapshot.empty) {
      return false;
    }

    const lastChatDoc = latestChatSnapshot.docs[0];

    const messagesQuery = query(
      collection(lastChatDoc.ref, "messages"),
      limit(1),
    );

    const messagesSnapshot = await getDocs(messagesQuery);

    // return true if an empty chat exists
    return messagesSnapshot.empty;
  } catch (error) {
    console.error("Error checking for empty chat:", {
      error: error instanceof Error ? error.message : "Unknown error",
      userEmail,
      timestamp: new Date().toISOString(),
    });

    return false;
  }
}

/*
  Determines the lobby state based on user authentication and chat status
*/
async function determineLobbyState(): Promise<LobbyState> {
  try {
    const session = await getAuthSession();

    if (!session?.user?.email) {
      return {
        isLoadingChats: false,
        hasNewChatAvailable: true,
      };
    }

    const hasEmptyChat = await checkForEmptyChat(session.user.email);

    return {
      isLoadingChats: false,
      hasNewChatAvailable: !hasEmptyChat,
    };
  } catch (error) {
    console.error("Error determining lobby state:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return {
      isLoadingChats: false,
      hasNewChatAvailable: true,
    };
  }
}

export const dynamic = "force-dynamic";

const HomePage = async () => {
  const { isLoadingChats, hasNewChatAvailable } = await determineLobbyState();

  return (
    <Lobby isLoadingChats={isLoadingChats} hasEmptyChat={hasNewChatAvailable} />
  );
};

export default HomePage;
