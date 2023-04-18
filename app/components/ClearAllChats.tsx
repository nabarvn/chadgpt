"use client";

import { db } from "@/firebase/firebase";
import { CheckIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { collection, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { useCollection } from "react-firebase-hooks/firestore";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ClearAllChats = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isButtonClicked, setIsButtonClicked] = useState(false);

  const [chats] = useCollection(
    session &&
      query(
        collection(db, "users", session.user?.email!, "chats"),
        orderBy("createdAt", "asc")
      )
  );

  const deleteAllChats = () => {
    chats?.docs.map((chat) =>
      deleteDoc(doc(db, "users", session?.user?.email!, "chats", chat.id))
    );

    router.push("/");
    setIsButtonClicked(false);
  };

  return (
    <button
      className={`relative adminRow disabled:hover:bg-[#202123] disabled:cursor-default w-full ${
        isButtonClicked && "cursor-default !space-x-0"
      }`}
      onClick={() => setIsButtonClicked(true)}
      disabled={isButtonClicked || !chats?.docs.length}
    >
      <TrashIcon
        className={`h-4 w-4 text-gray-500 ${
          isButtonClicked && "opacity-0"
        } transition duration-100`}
      />

      <p
        className={`${
          isButtonClicked && "opacity-0"
        } text-gray-300 transition duration-100`}
      >
        Clear conversations
      </p>

      <div
        className={`flex items-center justify-between absolute inset-0 ${
          isButtonClicked ? "block" : "hidden"
        } bg-gray-700/70 text-gray-300 rounded-lg p-3`}
      >
        <p>You sure?</p>

        <div className='flex space-x-2'>
          <CheckIcon
            className='h-4 w-4 hover:text-[#202123]'
            onClick={deleteAllChats}
          />

          <XMarkIcon
            className='h-4 w-4 hover:text-[#202123]'
            onClick={() => setIsButtonClicked(false)}
          />
        </div>
      </div>
    </button>
  );
};

export default ClearAllChats;
