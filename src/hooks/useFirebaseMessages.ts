import { useMemo } from "react";
import { Session } from "next-auth";
import { db } from "@/firebase/client";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, orderBy, query, Timestamp } from "firebase/firestore";
import { Message as MessageType, SerializedMessage } from "@/typings";

/*
  Custom hook for Firebase messages
*/
export function useFirebaseMessages(
  session: Session | null,
  chatId: string,
  initialMessages: SerializedMessage[],
) {
  const [messagesSnapshot, isLoadingMessages, messagesError] = useCollection(
    session?.user?.email
      ? query(
          collection(
            db,
            "users",
            session.user.email,
            "chats",
            chatId,
            "messages",
          ),
          orderBy("createdAt", "asc"),
        )
      : null,
  );

  const displayMessages = useMemo((): MessageType[] => {
    if (!messagesSnapshot) return initialMessages;

    return messagesSnapshot.docs.map((doc) => {
      const data = doc.data() as MessageType;
      const createdAt = (data.createdAt as Timestamp)?.toDate().toISOString();

      return {
        id: doc.id,
        text: data.text,
        user: data.user,
        createdAt,
      };
    });
  }, [messagesSnapshot, initialMessages]);

  return { displayMessages, isLoadingMessages, messagesError };
}
