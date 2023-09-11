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
    <>
      <div
        className={`adminRow ${
          !chats?.docs.length && "hover:bg-[#202123] cursor-default"
        } w-full ${isButtonClicked && "hidden cursor-default !space-x-0"}`}
        onClick={() => {
          if (chats?.docs.length) {
            setIsButtonClicked(true);
          }
        }}
      >
        <TrashIcon className='h-4 w-4 text-gray-500 transition duration-100' />

        <p className='text-gray-300 transition duration-100'>
          Clear conversations
        </p>
      </div>

      <div
        className={`flex items-center justify-between cursor-default ${
          isButtonClicked ? "block" : "hidden"
        } w-full bg-gray-700/70 text-sm text-gray-300 rounded-lg !mt-0 p-3`}
      >
        <p>You sure?</p>

        <div className='flex space-x-2'>
          <button onClick={deleteAllChats}>
            <CheckIcon className='h-4 w-4 hover:text-[#202123] cursor-default' />
          </button>

          <button onClick={() => setIsButtonClicked(false)}>
            <XMarkIcon className='h-4 w-4 hover:text-[#202123] cursor-default' />
          </button>
        </div>
      </div>
    </>
  );
};

export default ClearAllChats;
