"use client";

import { db } from "@/firebase/firebase";

import {
  BoltIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

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

const HomePage = () => {
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
    <div className='flex flex-col items-center justify-center min-h-screen text-gray-700 dark:text-gray-300 md:px-9'>
      <div className='sticky top-0 md:hidden bg-[#343541] h-11 w-full'>
        <div className='flex relative items-center text-gray-300 space-x-5 h-full'>
          <div className='flex inset-y-0 m-auto'>
            <h2 className='text-base'>Start chatting</h2>
            <button onClick={createChat} className='absolute right-5'>
              <PlusCircleIcon className='h-6 w-6' />
            </button>
          </div>
        </div>
      </div>

      <h1 className='text-5xl font-semibold mb-9 md:mb-20 mt-9 md:mt-0'>
        ChadGPT
      </h1>

      <div className='flex flex-col md:flex-row md:space-x-5 text-center'>
        <div className='mb-9 md:mb-0'>
          <div className='flex flex-row md:flex-col items-center justify-center mb-5 space-x-2 md:space-x-0 md:space-y-2'>
            <SunIcon className='h-5 w-5 md:h-7 md:w-7' />
            <h2>Examples</h2>
          </div>

          <div className='space-y-5'>
            <p className='infoText'>"Who is Satoshi Nakamoto?"</p>
            <p className='infoText'>
              "Explain the significance of NFTs in the digital world"
            </p>
            <p className='infoText'>
              "What is the difference between DeFi and CeFi?"
            </p>
          </div>
        </div>

        <div className='mb-9 md:mb-0'>
          <div className='flex flex-row md:flex-col items-center justify-center mb-5 space-x-2 md:space-x-0 md:space-y-2'>
            <BoltIcon className='h-5 w-5 md:h-7 md:w-7' />
            <h2>Capabilities</h2>
          </div>

          <div className='space-y-5'>
            <p className='infoText'>Switch between different ChadGPT models</p>
            <p className='infoText'>
              All conversations are stored in Firestore database by Firebase
            </p>
            <p className='infoText'>
              Chad responds using an auto-typing approach
            </p>
          </div>
        </div>

        <div className='mb-9 md:mb-0'>
          <div className='flex flex-row md:flex-col items-center justify-center mb-5 space-x-2 md:space-x-0 md:space-y-2'>
            <ExclamationTriangleIcon className='h-5 w-5 md:h-7 md:w-7' />
            <h2>Limitations</h2>
          </div>

          <div className='space-y-5'>
            <p className='infoText'>
              May ocassionally generate incorrect information
            </p>
            <p className='infoText'>
              Context based chatting might not be possible rn
            </p>
            <p className='infoText'>
              Limited knowledge of world and events after 2021
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
