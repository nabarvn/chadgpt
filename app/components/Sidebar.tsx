"use client";

import { useSession, signOut } from "next-auth/react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, orderBy, query } from "firebase/firestore";
import NewChat from "./NewChat";
import ChatBox from "./ChatBox";
import { db } from "@/firebase/firebase";
import ModelSelect from "./ModelSelect";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import ThemeSwitcher from "./ThemeSwitcher";
import ClearAllChats from "./ClearAllChats";
import Image from "next/image";

const Sidebar = () => {
  const { data: session } = useSession();

  const [chats, loading, error] = useCollection(
    session &&
      query(
        collection(db, "users", session.user?.email!, "chats"),
        orderBy("createdAt", "desc")
      )
  );

  const logout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <div
        className='hidden md:flex flex-col bg-[#202123] w-[16rem] max-w-[16rem] space-y-2 overflow-hidden p-2'
        style={{ height: "100svh" }}
      >
        <NewChat />

        {/*ModelSelection*/}
        <div>
          <ModelSelect defaultValue='gpt-3.5-turbo' />
        </div>

        <div className='overflow-x-hidden border-b border-gray-700 h-[70%] md:h-[77%] lg:h-[68%] scrollbar-thin scrollbar-thumb-[#434654] scrollbar-thumb-rounded-lg pb-2'>
          <div className='space-y-2'>
            {loading && <div className='dot-elastic m-auto mt-20' />}

            {error && (
              <div className='text-gray-300 text-center'>
                <p className='mt-9'>Error occured while loading chats...</p>
              </div>
            )}

            {/* Map Through Chat Rows */}
            <div className='overflow-y-auto space-y-2'>
              {chats?.docs.map((chat) => (
                <ChatBox key={chat.id} chatId={chat.id} />
              ))}
            </div>
          </div>
        </div>

        <div className='space-y-2 z-50 max-h-48'>
          {session && (
            <>
              <div className='flex flex-col space-y-2'>
                <ClearAllChats />

                <ThemeSwitcher />
              </div>

              <div onClick={logout} className='adminRow !justify-between'>
                <div className='flex space-x-2 items-center justify-center'>
                  <ArrowRightOnRectangleIcon className='h-4 w-4 text-gray-500' />
                  <p className='text-gray-300'>Log out</p>
                </div>

                <Image
                  src={session.user?.image!}
                  height={100}
                  width={100}
                  className='h-5 w-5 rounded-full'
                  alt='PFP'
                  unoptimized
                  priority
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
