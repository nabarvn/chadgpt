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
  emptyChatId: string | null;
}

async function findEmptyChatId(userEmail: string): Promise<string | null> {
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

    if (latestChatSnapshot.empty) {
      return null;
    }

    const lastChatDoc = latestChatSnapshot.docs[0];

    const messagesQuery = query(
      collection(lastChatDoc.ref, "messages"),
      limit(1),
    );

    const messagesSnapshot = await getDocs(messagesQuery);
    return messagesSnapshot.empty ? lastChatDoc.id : null;
  } catch (error) {
    console.error("Error checking for empty chat:", {
      error: error instanceof Error ? error.message : "Unknown error",
      userEmail,
      timestamp: new Date().toISOString(),
    });

    return null;
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
        emptyChatId: null,
      };
    }

    return {
      isLoadingChats: false,
      emptyChatId: await findEmptyChatId(session.user.email),
    };
  } catch (error) {
    console.error("Error determining lobby state:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return {
      isLoadingChats: false,
      emptyChatId: null,
    };
  }
}

export const dynamic = "force-dynamic";

const HomePage = async () => {
  const { isLoadingChats, emptyChatId } = await determineLobbyState();
  return <Lobby isLoadingChats={isLoadingChats} emptyChatId={emptyChatId} />;
};

export default HomePage;
