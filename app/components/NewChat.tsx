"use client";

import { db } from "@/firebase/firebase";
import { PlusIcon } from "@heroicons/react/24/solid";

import {
  addDoc,
  collection,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";

const NewChat = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [chats] = useCollection(
    session &&
      query(
        collection(db, "users", session.user?.email!, "chats"),
        orderBy("createdAt", "asc")
      )
  );

  const [messages] = useCollection(
    session && chats?.docs.length
      ? query(
          collection(
            db,
            "users",
            session.user?.email!,
            "chats",
            chats?.docs[chats.docs.length - 1].id!,
            "messages"
          ),
          orderBy("createdAt", "asc")
        )
      : null
  );

  const createChat = async () => {
    if (!messages?.empty) {
      const doc = await addDoc(
        collection(db, "users", session?.user?.email!, "chats"),
        {
          // messages: [],
          userId: session?.user?.email!,
          createdAt: serverTimestamp(),
        }
      );

      router.push(`/chat/${doc.id}`);
    }
  };

  return (
    <div
      onClick={createChat}
      className={`border border-gray-700 chatRow ${
        messages?.empty && "cursor-default hover:bg-[#202123]"
      } px-3 py-3`}
    >
      <PlusIcon className='h-4 w-4 text-gray-500' />
      <p className='text-gray-300'>New chat</p>
    </div>
  );
};

export default NewChat;
