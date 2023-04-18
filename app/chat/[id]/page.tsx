"use client";

import { db } from "@/firebase/firebase";
import { useSession } from "next-auth/react";
import { useCollection } from "react-firebase-hooks/firestore";

import {
  ArrowDownCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

import { ArrowDownIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import ScrollableFeed from "react-scrollable-feed";
// import useSWR from "swr";

import {
  collection,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// import ReactMarkdown from "react-markdown";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

// import remarkGfm from "remark-gfm";
// import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

type Props = {
  params: {
    id: string;
  };
};

const ChatPage = ({ params: { id } }: Props) => {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [chadProcessing, setChadProcessing] = useState(false);
  const [chadResponded, setChadResponded] = useState(false);
  // const [isCodeSnippet, setIsCodeSnippet] = useState(false);
  // const [chadResponse, setChadResponse] = useState("");

  const scrollableRef = useRef<ScrollableFeed>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const messageRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const [chadResponding, setChadResponding] = useState(false);

  const [messages, loading] = useCollection(
    session &&
      query(
        collection(db, "users", session.user?.email!, "chats", id, "messages"),
        orderBy("createdAt", "asc")
      )
  );

  useEffect(() => {
    if (scrollableRef.current && isAtBottom) {
      scrollableRef.current.scrollToBottom();
    }

    setTimeout(() => {
      setMounted(true);
    }, 1000);
  }, [messages]);

  // useSWR to get model
  // const { data: model } = useSWR("model", {
  //   fallbackData: "text-davinci-003",
  // });

  const model = "text-davinci-003";

  const autoTypingBotResponse = (text: string) => {
    let index = 0;

    setChadResponding(true);

    setTimeout(() => {
      let interval = setInterval(() => {
        if (index < text.length) {
          if (messageRef.current) {
            messageRef.current.textContent += text.charAt(index);
          }
          index++;
        } else {
          clearInterval(interval);

          setChadResponding(false);
        }
      }, 9);
    }, 21);
  };

  if (chadResponded) {
    autoTypingBotResponse(
      messages?.docs[messages?.docs.length - 1]?.data().text.trimStart()
    );

    setChadResponded(false);
  }

  // if (chadProcessing) {
  //   let loadInterval = setInterval(() => {
  //     if (loadingRef.current) {
  //       loadingRef.current.textContent += ".";

  //       if (loadingRef.current.textContent === "....")
  //         loadingRef.current.textContent = "";
  //     }
  //   }, 300);
  // }

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!prompt) return;

    const input = prompt.trim();

    if (input === "") return;

    setPrompt("");
    setChadProcessing(true);

    const message: Message = {
      text: input,
      createdAt: serverTimestamp(),
      user: {
        _id: session?.user?.email,
        name: session?.user?.name,
        avatar:
          session?.user?.image ||
          `https://ui-avatars.com/api/?name=${session?.user?.name}`,
      },
    };

    await addDoc(
      collection(db, "users", session?.user?.email!, "chats", id, "messages"),
      message
    );

    //Toast Notification while processing...
    // const notification = toast.loading("Chad is processing...");

    await fetch("/api/prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input,
        id,
        model,
        session,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((chadMessage) => {
        setChadProcessing(false);
        setChadResponded(true);
        // setChadResponse(chadMessage);

        // if (chadMessage.response.trim().includes(";")) setIsCodeSnippet(true);

        // Toast notification when successful!
        // toast.success("Chad has responded!", {
        //   id: notification,
        // });
      });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      sendMessage(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  function updateIsAtBottomState(result: boolean) {
    setIsAtBottom(result);
  }

  const scrollToBottom = () => {
    scrollableRef.current?.scrollToBottom();
  };

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
    <div className='flex flex-col h-screen overflow-hidden'>
      <div className='sticky top-0 md:hidden bg-[#343541] h-11 w-full'>
        <div className='flex relative items-center text-gray-300 h-full'>
          <div className='w-[16rem] inset-y-0 m-auto'>
            <p className='relative text-center text-base truncate'>
              {mounted &&
                (messages?.docs[messages?.docs.length - 1]?.data().text ||
                  "New Chat")}

              <span
                className={`absolute inset-y-0 right-0 w-9 h-7 z-10 bg-gradient-to-l opacity-90 from-[#343541]`}
              />
            </p>
          </div>

          <button onClick={createChat} className='absolute right-5'>
            <PlusCircleIcon className='h-6 w-6' />
          </button>
        </div>
      </div>

      {/* Chat */}

      <ScrollableFeed
        ref={scrollableRef}
        onScroll={(isAtBottom: boolean) => updateIsAtBottomState(isAtBottom)}
        className={`flex-1 ${
          !isAtBottom && "scroll-smooth"
        } scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-[#202123] scrollbar-thumb-rounded-lg`}
      >
        <div className='overflow-y-auto overflow-x-hidden'>
          {messages?.empty && (
            <>
              <p className='text-gray-700 dark:text-gray-300 text-lg md:text-xl text-center mt-10'>
                Write a prompt below to get started!
              </p>
              <ArrowDownCircleIcon className='text-gray-700 dark:text-gray-300 h-9 w-9 animate-bounce mx-auto mt-5' />
            </>
          )}

          {loading && <div className='dot-spin m-auto mt-52'></div>}

          {/* Message */}
          {messages?.docs.map((message, i) => {
            const isChad = message.data().user.name === "Chad";

            return (
              <div
                key={i}
                className={`flex text-gray-700 dark:text-gray-300 ${
                  isChad && "bg-gray-100 dark:bg-[#434654]"
                } py-5 max-w-2xl mx-auto space-x-5 px-10`}
              >
                <div className='shrink-0 object-cover'>
                  <img
                    src={message.data().user.avatar}
                    alt='avatar'
                    className='h-7 w-7'
                  />
                </div>

                <div className='max-w-2xl'>
                  <p ref={messageRef} className='text-sm whitespace-pre-wrap'>
                    {isChad && i === messages?.docs.length - 1 && chadResponding
                      ? null
                      : message.data().text.trimStart()}
                  </p>
                </div>
              </div>
            );
          })}

          {!isAtBottom && (
            <div className='absolute bottom-36 right-5 lg:bottom-36 xl:right-36'>
              <button
                type='button'
                onClick={scrollToBottom}
                disabled={isAtBottom}
                className={`${
                  isAtBottom && "hidden"
                } inline-flex items-center p-2 rounded-full shadow-sm bg-gray-300 bg-opacity-70 active:bg-gray-500 dark:bg-gray-500 dark:bg-opacity-70 dark:active:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none`}
              >
                <ArrowDownIcon className='h-3 w-3' aria-hidden='true' />
              </button>
            </div>
          )}
        </div>
      </ScrollableFeed>

      {/* ChatPrompt */}
      <div className='bg-gray-300 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg text-sm mx-7 xl:mx-20 my-7 xl:my-10'>
        <form
          onSubmit={sendMessage}
          className='flex items-center bg-white dark:bg-[#202123] shadow-lg rounded-lg space-x-5 p-3'
        >
          <textarea
            name='prompt'
            autoComplete='off'
            autoFocus
            value={prompt}
            rows={1}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={!session && chadResponding}
            className='flex-1 bg-transparent break-words focus:outline-none disabled:cursor-not-allowed disabled:text-gray-300 overflow-y-auto resize-none scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-rounded-lg'
            placeholder='Send a message...'
            onKeyDown={handleKeyDown}
          />

          <button
            type='submit'
            disabled={!prompt || !session}
            className={`bg-[#11A37F] ${
              chadProcessing && "bg-[#11A37F]"
            } active:bg-green-900 text-white ${
              !chadProcessing &&
              "disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:hover:opacity-100"
            } font-bold rounded px-3 py-2 h-7`}
          >
            {chadProcessing ? (
              <span ref={loadingRef} className='loading'></span>
            ) : (
              <PaperAirplaneIcon className='h-3 w-3 -rotate-45' />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
