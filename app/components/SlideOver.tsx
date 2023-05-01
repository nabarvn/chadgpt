"use client";

import { useSession, signOut } from "next-auth/react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, orderBy, query } from "firebase/firestore";
import NewChat from "./NewChat";
import ChatBox from "./ChatBox";
import { db } from "@/firebase/firebase";
import ModelSelect from "./ModelSelect";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Disclosure } from "@headlessui/react";
import ThemeSwitcher from "./ThemeSwitcher";
import ClearAllChats from "./ClearAllChats";
import Image from "next/image";

const SlideOver = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

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
      <Disclosure as='nav'>
        <>
          <Disclosure.Button
            onClick={() => setIsOpen(true)}
            className='fixed block md:hidden top-2 left-3 z-10 items-center peer justify-center rounded-md text-gray-300 hover:bg-gray-900 hover:text-gray-300 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white ml-2'
          >
            <Bars3Icon className='h-7 w-7' aria-hidden='true' />
          </Disclosure.Button>

          <div
            className={`flex flex-col md:hidden bg-[#202123] w-[16rem] max-w-[16rem] z-20 fixed top-0 ${
              isOpen ? "left-0" : "-left-96"
            } lg:left-0 lg:w-[16rem] peer-focus:left-0 peer:transition lg:transition-none ease-out delay-150 duration-200 space-y-2 overflow-hidden p-2`}
            style={{ height: "100svh" }}
          >
            <div onClick={() => setIsOpen(false)}>
              <NewChat />
            </div>

            {/*ModelSelection*/}
            <div onClick={() => setIsOpen(true)}>
              <ModelSelect defaultValue='text-davinci-003' />
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
                    <div key={chat.id} onClick={() => setIsOpen(false)}>
                      <ChatBox chatId={chat.id} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='space-y-2 z-50 max-h-48'>
              {session && (
                <>
                  <div className='flex flex-col space-y-2'>
                    <div onClick={() => setIsOpen(true)}>
                      <ClearAllChats />
                    </div>
                    <div onClick={() => setIsOpen(false)}>
                      <ThemeSwitcher />
                    </div>
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
      </Disclosure>

      <div
        onClick={() => setIsOpen(false)}
        className={`md:hidden ${
          !isOpen && "hidden"
        } fixed inset-0 h-screen z-10 bg-black/10`}
      />
    </>
  );
};

export default SlideOver;
