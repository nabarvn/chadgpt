import { db } from "@/firebase/client";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  DocumentData,
  Timestamp,
} from "firebase/firestore";

import { ChatView } from "@/components";
import { SerializedMessage } from "@/typings";

interface ChatPageProps {
  params: {
    id: string;
  };
  searchParams: {
    prompt?: string;
  };
}

interface FirestoreMessageData {
  text: string;
  createdAt: Timestamp;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
}

/*
  Validates and sanitizes the chat ID parameter
*/
function validateChatId(id: string): string {
  const sanitizedId = id?.trim();

  if (!sanitizedId || sanitizedId.length === 0) {
    throw new Error("Invalid chat ID provided");
  }

  return sanitizedId;
}

/*
  Safely transforms Firestore message data to SerializedMessage
*/
function transformMessageData(
  docId: string,
  data: DocumentData,
): SerializedMessage {
  const messageData = data as FirestoreMessageData;

  if (!messageData.text || !messageData.createdAt || !messageData.user) {
    throw new Error(`Invalid message data structure for document ${docId}`);
  }

  return {
    id: docId,
    text: messageData.text,
    createdAt: messageData.createdAt.toDate().toISOString(),
    user: messageData.user,
  };
}

/*
  Verifies chat ownership and existence
*/
async function verifyChatAccess(
  chatId: string,
  userEmail: string,
): Promise<boolean> {
  try {
    const chatDocRef = doc(db, "users", userEmail, "chats", chatId);
    const chatDoc = await getDoc(chatDocRef);

    return chatDoc.exists();
  } catch (error) {
    console.error("Error verifying chat access:", {
      error: error instanceof Error ? error.message : "Unknown error",
      chatId,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    return false;
  }
}

/*
  Fetches and transforms chat messages
*/
async function fetchChatMessages(
  chatId: string,
  userEmail: string,
): Promise<SerializedMessage[]> {
  try {
    const chatDocRef = doc(db, "users", userEmail, "chats", chatId);
    const messagesCollection = collection(chatDocRef, "messages");

    const messagesQuery = query(
      messagesCollection,
      orderBy("createdAt", "asc"),
    );

    const messagesSnapshot = await getDocs(messagesQuery);

    return messagesSnapshot.docs.map((docSnapshot) => {
      return transformMessageData(docSnapshot.id, docSnapshot.data());
    });
  } catch (error) {
    console.error("Error fetching chat messages:", {
      error: error instanceof Error ? error.message : "Unknown error",
      chatId,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    throw new Error("Failed to load chat messages");
  }
}

const ChatPage = async ({ params: { id }, searchParams }: ChatPageProps) => {
  try {
    const session = await getAuthSession();

    if (!session?.user?.email) {
      redirect("/");
    }

    const chatId = validateChatId(id);
    const userEmail = session.user.email;

    const hasAccess = await verifyChatAccess(chatId, userEmail);

    if (!hasAccess) {
      redirect("/");
    }

    const initialMessages = await fetchChatMessages(chatId, userEmail);

    return (
      <ChatView
        chatId={chatId}
        session={session}
        initialMessages={initialMessages}
        initialPrompt={searchParams.prompt}
      />
    );
  } catch (error) {
    console.error("ChatPage error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      chatId: id,
      timestamp: new Date().toISOString(),
    });

    redirect("/");
  }
};

export default ChatPage;
