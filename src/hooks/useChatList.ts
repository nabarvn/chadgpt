import { useMemo } from "react";
import { db } from "@/firebase/client";
import { useSession } from "next-auth/react";
import { validateAndTransformSession } from "@/lib/utils";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, orderBy, query } from "firebase/firestore";

export function useChatList() {
  const { data: session, status } = useSession();

  const { isValid: isValidSession, userEmail } = useMemo(
    () => validateAndTransformSession(session),
    [session],
  );

  const chatsQuery = useMemo(() => {
    if (!isValidSession || !userEmail) return null;

    return query(
      collection(db, "users", userEmail, "chats"),
      orderBy("createdAt", "desc"),
    );
  }, [isValidSession, userEmail]);

  const [chatsSnapshot, isLoadingChats, chatsError] = useCollection(chatsQuery);

  return {
    session,
    status,
    chatsSnapshot,
    isLoadingChats,
    chatsError,
    isValidSession,
  };
}
