"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChatBubbleLeftIcon, TrashIcon } from "@heroicons/react/24/outline";
import { collection, deleteDoc, doc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/firebase/firebase";

type Props = {
  chatId: string;
};

const ChatBox = ({ chatId }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!pathname) return;

    setTimeout(() => {
      setMounted(true);
    }, 1000);

    setActive(pathname.includes(chatId));
  }, [pathname]);

  const [messages] = useCollection(
    collection(db, "users", session?.user?.email!, "chats", chatId, "messages")
  );

  const deleteChat = async () => {
    await deleteDoc(doc(db, "users", session?.user?.email!, "chats", chatId));
    router.push("/");
  };

  return (
    <Link
      href={`/chat/${chatId}`}
      className={`chatRow group justify-center ${
        active ? "bg-gray-700/50 pr-2.5" : "pr-1 hover:pr-2.5"
      } px-3 py-3`}
    >
      <ChatBubbleLeftIcon className='h-4 w-4 text-gray-500' />

      <p className='flex-1 relative text-gray-300 truncate'>
        {mounted &&
          (messages?.docs[messages?.docs.length - 1]?.data().text ||
            "New Chat")}

        <span
          className={`absolute inset-y-0 right-0 w-9 h-7 z-10 ${
            !active && "bg-gradient-to-l"
          } opacity-90 from-[#202123] group-hover:bg-none`}
        />
      </p>

      <TrashIcon
        onClick={deleteChat}
        className={`h-1 w-1 group-hover:h-4 group-hover:w-4 ${
          active && "h-4 w-4"
        } opacity-0 group-hover:opacity-100 ${
          active && "opacity-100"
        } text-gray-500 hover:text-red-900 transition duration-300`}
      />
    </Link>
  );
};

export default ChatBox;
